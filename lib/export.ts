import type { ResumeData } from "./types";

function safeFilename(name: string) {
  return (name || "resume").trim().replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "") || "resume";
}

function saveBlob(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(data: ResumeData) {
  saveBlob(JSON.stringify(data, null, 2), "application/json;charset=utf-8", `${safeFilename(data.basics.name)}-resume.json`);
}

export function resumeToText(data: ResumeData) {
  const contact = [data.basics.email, data.basics.phone, data.basics.location, data.basics.website].filter(Boolean).join(" | ");
  const lines = [data.basics.name, data.basics.headline, contact, "", data.basics.summary];

  if (data.experience.length) {
    lines.push("", "EXPERIENCE");
    data.experience.forEach((item) => {
      lines.push(`${item.role}${item.company ? ` — ${item.company}` : ""}`);
      lines.push([item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" | "));
      item.highlights.forEach((highlight) => lines.push(`• ${highlight}`));
    });
  }

  if (data.education.length) {
    lines.push("", "EDUCATION");
    data.education.forEach((item) => {
      lines.push(`${item.degree}${item.field ? `, ${item.field}` : ""}${item.school ? ` — ${item.school}` : ""}`);
      lines.push([[item.start, item.end].filter(Boolean).join(" – "), item.location].filter(Boolean).join(" | "));
      if (item.details) lines.push(item.details);
    });
  }

  if (data.publications.length) {
    lines.push("", "PUBLICATIONS");
    data.publications.forEach((item) => lines.push([item.authors, item.title, item.venue, item.year].filter(Boolean).join(". ")));
  }

  if (data.projects.length) {
    lines.push("", "PROJECTS");
    data.projects.forEach((item) => lines.push([item.name, item.role, item.date].filter(Boolean).join(" | "), item.description));
  }

  if (data.skills.length) lines.push("", "SKILLS", data.skills.join(" · "));
  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n").trim();
}

export function downloadText(data: ResumeData) {
  saveBlob(resumeToText(data), "text/plain;charset=utf-8", `${safeFilename(data.basics.name)}-resume.txt`);
}
