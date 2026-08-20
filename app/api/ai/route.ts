import { NextResponse } from "next/server";
import { normalizeResume } from "@/lib/normalize";
import type { ProviderId } from "@/lib/types";

export const runtime = "nodejs";

const MAX_SOURCE_LENGTH = 40_000;
const MAX_JOB_LENGTH = 20_000;

const schemaDescription = `
Return exactly one JSON object with this shape:
{
  "basics": {"name":"","headline":"","email":"","phone":"","location":"","website":"","summary":""},
  "experience": [{"id":"","company":"","role":"","location":"","start":"","end":"","highlights":[""]}],
  "education": [{"id":"","school":"","degree":"","field":"","location":"","start":"","end":"","details":""}],
  "publications": [{"id":"","title":"","authors":"","venue":"","year":"","url":""}],
  "projects": [{"id":"","name":"","role":"","date":"","description":"","url":""}],
  "skills": [""]
}`;

function providerConfig(provider: ProviderId) {
  if (provider === "kimi") {
    return {
      key: process.env.MOONSHOT_API_KEY,
      baseUrl: process.env.KIMI_BASE_URL ?? "https://api.moonshot.cn/v1",
      model: process.env.KIMI_MODEL ?? "kimi-k2.6",
      label: "Kimi",
    };
  }

  return {
    key: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    label: "DeepSeek",
  };
}

function extractJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Model response did not contain JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const provider: ProviderId = body.provider === "kimi" ? "kimi" : "deepseek";
    const action = body.action === "parse" ? "parse" : "improve";
    const sourceText = text(body.sourceText).slice(0, MAX_SOURCE_LENGTH);
    const jobDescription = text(body.jobDescription).slice(0, MAX_JOB_LENGTH);
    const resume = body.resume ? normalizeResume(body.resume) : null;
    const config = providerConfig(provider);

    if (!config.key) {
      return NextResponse.json(
        { error: `${config.label} 尚未配置 API Key。请在服务器环境变量中添加对应密钥。` },
        { status: 503 },
      );
    }

    if (action === "parse" && !sourceText) {
      return NextResponse.json({ error: "请先上传或粘贴简历文本。" }, { status: 400 });
    }

    if (action === "improve" && !resume) {
      return NextResponse.json({ error: "没有可优化的简历内容。" }, { status: 400 });
    }

    const task =
      action === "parse"
        ? `Extract the resume text into the JSON schema. Preserve the source language. Use empty strings or arrays for missing fields.\n\nSOURCE RESUME:\n${sourceText}`
        : `Edit the supplied resume for clarity, specificity, concise action-led bullets, and ATS readability. Preserve the original language unless the source mixes languages. Use the optional job description only to prioritize truthful existing evidence.\n\nRESUME JSON:\n${JSON.stringify(resume)}\n\nOPTIONAL JOB DESCRIPTION:\n${jobDescription || "Not supplied"}`;

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a meticulous resume editor. Never invent employers, roles, dates, degrees, metrics, skills, publications, awards, or outcomes. Never infer protected or personal attributes. Do not add facts that are absent from the input. When improving, retain every material fact and only rewrite wording. " +
              schemaDescription,
          },
          { role: "user", content: task },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 600);
      return NextResponse.json(
        { error: `${config.label} 请求失败（${response.status}）。`, detail },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Model returned an empty response.");

    return NextResponse.json({ resume: normalizeResume(extractJson(content)), provider, model: config.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "无法处理这次 AI 请求。", detail: message }, { status: 500 });
  }
}
