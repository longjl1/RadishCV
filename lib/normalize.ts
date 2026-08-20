import { createDefaultSectionSettings, resumeSectionIds, type CustomSection, type ResumeData, type ResumeSectionSettings, type ResumeState } from "./types";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const list = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, 20) : [];
const rows = (value: unknown) => Array.isArray(value) ? value.slice(0, 30) : [];
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function normalizeSectionSettings(value: unknown, fallback: ResumeSectionSettings): ResumeSectionSettings {
  const root = record(value);
  const defaults = createDefaultSectionSettings();
  return Object.fromEntries(resumeSectionIds.map((id) => {
    const setting = record(root[id]);
    const fallbackSetting = fallback[id] ?? defaults[id];
    return [id, {
      enabled: id === "basics" ? true : typeof setting.enabled === "boolean" ? setting.enabled : fallbackSetting.enabled,
      title: text(setting.title) || fallbackSetting.title,
    }];
  })) as ResumeSectionSettings;
}

function normalizeCustomSections(value: unknown): CustomSection[] {
  return rows(value).map((item, sectionIndex) => {
    const section = record(item);
    const sectionId = text(section.id) || `custom-${sectionIndex}-${Date.now()}`;
    const items = rows(section.items).map((itemValue, itemIndex) => {
      const itemRecord = record(itemValue);
      return {
        id: text(itemRecord.id) || `${sectionId}-item-${itemIndex}-${Date.now()}`,
        text: text(itemRecord.text),
      };
    });
    return { id: sectionId, title: text(section.title) || "Custom Section", items };
  }).slice(0, 20);
}

export function normalizeResume(value: unknown): ResumeData {
  const root = record(value);
  const basics = record(root.basics);
  const id = (prefix: string, row: Record<string, unknown>, index: number) => text(row.id) || `${prefix}-${index}-${Date.now()}`;

  return {
    basics: {
      name: text(basics.name), headline: text(basics.headline), email: text(basics.email),
      phone: text(basics.phone), location: text(basics.location), website: text(basics.website), summary: text(basics.summary),
    },
    experience: rows(root.experience).map((item, index) => {
      const row = record(item);
      return { id: id("exp", row, index), company: text(row.company), role: text(row.role), location: text(row.location), start: text(row.start), end: text(row.end), highlights: list(row.highlights) };
    }),
    education: rows(root.education).map((item, index) => {
      const row = record(item);
      return { id: id("edu", row, index), school: text(row.school), degree: text(row.degree), field: text(row.field), location: text(row.location), start: text(row.start), end: text(row.end), details: text(row.details) };
    }),
    publications: rows(root.publications).map((item, index) => {
      const row = record(item);
      return { id: id("pub", row, index), title: text(row.title), authors: text(row.authors), venue: text(row.venue), year: text(row.year), url: text(row.url) };
    }),
    projects: rows(root.projects).map((item, index) => {
      const row = record(item);
      return { id: id("project", row, index), name: text(row.name), role: text(row.role), date: text(row.date), description: text(row.description), url: text(row.url) };
    }),
    skills: list(root.skills),
  };
}

export function normalizeState(value: unknown, fallback: ResumeState): ResumeState {
  const root = record(value);
  const template = root.template === "harvard" || root.template === "yale" || root.template === "mit" ? root.template : fallback.template;
  const font = root.font === "calibri" || root.font === "aptos" || root.font === "arial" || root.font === "garamond" || root.font === "cambria" ? root.font : fallback.font;
  const provider = root.provider === "kimi" || root.provider === "deepseek" ? root.provider : fallback.provider;
  return {
    data: normalizeResume("data" in root ? root.data : root),
    template,
    font,
    provider,
    jobDescription: text(root.jobDescription),
    sectionSettings: normalizeSectionSettings(root.sectionSettings, fallback.sectionSettings),
    customSections: Array.isArray(root.customSections) ? normalizeCustomSections(root.customSections) : fallback.customSections,
  };
}
