export type TemplateId = "mit" | "harvard" | "yale";
export type ProviderId = "deepseek" | "kimi";
export type ResumeFontId = "calibri" | "aptos" | "arial" | "garamond" | "cambria";

export type Basics = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

export type Publication = {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  url: string;
};

export type Project = {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  url: string;
};

export type ResumeData = {
  basics: Basics;
  experience: Experience[];
  education: Education[];
  publications: Publication[];
  projects: Project[];
  skills: string[];
};

export type ResumeState = {
  data: ResumeData;
  template: TemplateId;
  font: ResumeFontId;
  provider: ProviderId;
  jobDescription: string;
};

export type ResumeSectionId =
  | "basics"
  | "experience"
  | "education"
  | "publications"
  | "projects"
  | "skills";

export type EditorSelection = {
  section: ResumeSectionId;
  entryId?: string;
  field?: string;
  index?: number;
};

export type ResumeEditAction =
  | { type: "basics"; field: keyof Basics; value: string }
  | { type: "experience"; id: string; field: Exclude<keyof Experience, "id" | "highlights">; value: string }
  | { type: "experience-highlight"; id: string; index: number; value: string }
  | { type: "experience-highlights"; id: string; value: string[] }
  | { type: "education"; id: string; field: Exclude<keyof Education, "id">; value: string }
  | { type: "publication"; id: string; field: Exclude<keyof Publication, "id">; value: string }
  | { type: "project"; id: string; field: Exclude<keyof Project, "id">; value: string }
  | { type: "skill"; index: number; value: string };

export type ResumeAddAction =
  | { type: "experience" }
  | { type: "experience-highlight"; id: string }
  | { type: "education" }
  | { type: "publication" }
  | { type: "project" }
  | { type: "skill" };

export type ResumeDeleteAction =
  | { type: "experience"; id: string }
  | { type: "experience-highlight"; id: string; index: number }
  | { type: "education"; id: string }
  | { type: "publication"; id: string }
  | { type: "project"; id: string }
  | { type: "skill"; index: number };

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const emptyResume: ResumeData = {
  basics: {
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  publications: [],
  projects: [],
  skills: [],
};

export const sampleResume: ResumeData = {
  basics: {
    name: "Alex Chen",
    headline: "Product-minded software engineer",
    email: "alex.chen@example.com",
    phone: "+852 5555 0100",
    location: "Hong Kong",
    website: "alexchen.dev",
    summary:
      "Software engineer focused on turning complex workflows into clear, reliable products.",
  },
  experience: [
    {
      id: "sample-exp",
      company: "Northstar Labs",
      role: "Senior Software Engineer",
      location: "Hong Kong",
      start: "2023",
      end: "Present",
      highlights: [
        "Led a cross-functional team of five to launch a research workflow used by 1,200 monthly users.",
        "Reduced document processing time by 38% through queue and caching improvements.",
      ],
    },
    {
      id: "sample-exp-2",
      company: "Orbit Systems",
      role: "Software Engineer",
      location: "Remote",
      start: "2020",
      end: "2023",
      highlights: [
        "Built TypeScript services and internal tools for a distributed operations team.",
      ],
    },
  ],
  education: [
    {
      id: "sample-edu",
      school: "Example University",
      degree: "B.Sc.",
      field: "Computer Science",
      location: "Hong Kong",
      start: "2016",
      end: "2020",
      details: "First Class Honours",
    },
  ],
  publications: [
    {
      id: "sample-pub",
      title: "Designing Auditable AI Workflows",
      authors: "A. Chen, J. Rivera",
      venue: "Example Conference on Human-Centred Computing",
      year: "2024",
      url: "",
    },
  ],
  projects: [
    {
      id: "sample-project",
      name: "Evidence Desk",
      role: "Creator",
      date: "2024",
      description: "Local-first research organiser with source-level citations.",
      url: "github.com/alexchen/evidence-desk",
    },
  ],
  skills: ["TypeScript", "Next.js", "Python", "PostgreSQL", "Product discovery"],
};
