import type { TemplateId } from "./types";

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  eyebrow: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const templates: TemplateDefinition[] = [
  {
    id: "mit",
    name: "MIT Classic",
    eyebrow: "Compact · Technical",
    description: "Dense, single-column hierarchy suited to engineering and product roles.",
    sourceLabel: "MIT composite samples (PDF)",
    sourceUrl: "https://cdn.uconnectlabs.com/wp-content/uploads/sites/123/2025/05/Composite-resume-samples-1.pdf",
  },
  {
    id: "harvard",
    name: "Harvard Academic",
    eyebrow: "Editorial · Research",
    description: "Serif-led academic layout with generous section rhythm for CVs and research.",
    sourceLabel: "Harvard GSAS CV guide (PDF)",
    sourceUrl: "https://hwpi.harvard.edu/files/ocs/files/gsas-cvs-and-cover-letters.pdf",
  },
  {
    id: "yale",
    name: "Yale Modern",
    eyebrow: "Clear · ATS friendly",
    description: "Clean contemporary structure with restrained accent colour and easy scanning.",
    sourceLabel: "Yale OCS resume templates",
    sourceUrl: "https://ocs.yale.edu/resources/ocs-resume-template/",
  },
];
