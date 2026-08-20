import type { ResumeState } from "./types";

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

export function downloadJson(state: ResumeState) {
  const backup = {
    version: 2,
    data: state.data,
    template: state.template,
    font: state.font,
    sectionSettings: state.sectionSettings,
    customSections: state.customSections,
  };
  saveBlob(JSON.stringify(backup, null, 2), "application/json;charset=utf-8", `${safeFilename(state.data.basics.name)}-resume.json`);
}

export function resumeToText(state: ResumeState) {
  const { data, sectionSettings, customSections } = state;
  const contact = [data.basics.email, data.basics.phone, data.basics.location, data.basics.website].filter(Boolean).join(" | ");
  const lines = [data.basics.name, data.basics.headline, contact];

  if (data.basics.summary) lines.push("", sectionSettings.basics.title.toUpperCase(), data.basics.summary);

  if (sectionSettings.experience.enabled && data.experience.length) {
    lines.push("", sectionSettings.experience.title.toUpperCase());
    data.experience.forEach((item) => {
      lines.push(`${item.role}${item.company ? ` — ${item.company}` : ""}`);
      lines.push([item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" | "));
      item.highlights.forEach((highlight) => lines.push(`• ${highlight}`));
    });
  }

  if (sectionSettings.education.enabled && data.education.length) {
    lines.push("", sectionSettings.education.title.toUpperCase());
    data.education.forEach((item) => {
      lines.push(`${item.degree}${item.field ? `, ${item.field}` : ""}${item.school ? ` — ${item.school}` : ""}`);
      lines.push([[item.start, item.end].filter(Boolean).join(" – "), item.location].filter(Boolean).join(" | "));
      if (item.details) lines.push(item.details);
    });
  }

  if (sectionSettings.publications.enabled && data.publications.length) {
    lines.push("", sectionSettings.publications.title.toUpperCase());
    data.publications.forEach((item) => lines.push([item.authors, item.title, item.venue, item.year].filter(Boolean).join(". ")));
  }

  if (sectionSettings.projects.enabled && data.projects.length) {
    lines.push("", sectionSettings.projects.title.toUpperCase());
    data.projects.forEach((item) => lines.push([item.name, item.role, item.date].filter(Boolean).join(" | "), item.description));
  }

  if (sectionSettings.skills.enabled && data.skills.length) lines.push("", sectionSettings.skills.title.toUpperCase(), data.skills.join(" · "));
  customSections.forEach((section) => {
    const items = section.items.map((item) => item.text).filter(Boolean);
    if (items.length) lines.push("", section.title.toUpperCase(), ...items.map((item) => `• ${item}`));
  });
  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n").trim();
}

export function downloadText(state: ResumeState) {
  saveBlob(resumeToText(state), "text/plain;charset=utf-8", `${safeFilename(state.data.basics.name)}-resume.txt`);
}
