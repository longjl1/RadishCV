"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Download,
  FileDown,
  FileJson,
  FileText,
  GraduationCap,
  Library,
  ListPlus,
  ListChecks,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCcw,
  Settings2,
  Sparkles,
  Upload,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ResumePreview } from "@/components/resume-preview";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadJson, downloadText } from "@/lib/export";
import { normalizeResume, normalizeState } from "@/lib/normalize";
import { templates } from "@/lib/templates";
import { cn } from "@/lib/utils";
import {
  createId,
  createDefaultSectionSettings,
  emptyResume,
  sampleResume,
  type CustomSection,
  type EditorSelection,
  type ProviderId,
  type ResumeAddAction,
  type ResumeData,
  type ResumeDeleteAction,
  type ResumeEditAction,
  type ResumeFontId,
  type ResumeSectionId,
  type ResumeState,
} from "@/lib/types";

const STORAGE_KEY = "papertrail-resume-v1";
const PREFERENCES_KEY = "radishcv-ui-preferences-v1";
const initialState: ResumeState = { data: sampleResume, template: "mit", font: "arial", provider: "deepseek", jobDescription: "", sectionSettings: createDefaultSectionSettings(), customSections: [] };
type AIStatus = { kind: "idle" | "loading" | "success" | "error"; message: string };
type InspectorTab = "edit" | "ai" | "design" | "export";
type RenameTarget = { type: "built-in"; id: ResumeSectionId } | { type: "custom"; id: string };
type SectionDeleteTarget = { type: "built-in"; id: Exclude<ResumeSectionId, "basics"> } | { type: "custom"; id: string };

const fontOptions: Array<{ id: ResumeFontId; name: string; stack: string }> = [
  { id: "calibri", name: "Calibri", stack: "Calibri, Carlito, Arial, sans-serif" },
  { id: "aptos", name: "Aptos", stack: "Aptos, 'Segoe UI', Arial, sans-serif" },
  { id: "arial", name: "Arial", stack: "Arial, Helvetica, sans-serif" },
  { id: "garamond", name: "Garamond", stack: "Garamond, Georgia, 'Times New Roman', serif" },
  { id: "cambria", name: "Cambria", stack: "Cambria, Georgia, 'Times New Roman', serif" },
];

const sectionMeta: Array<{ id: ResumeSectionId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "basics", label: "Profile", icon: UserRound },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "publications", label: "Publications", icon: Library },
  { id: "projects", label: "Projects", icon: ListChecks },
  { id: "skills", label: "Skills", icon: Wrench },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium text-muted-foreground">{children}</span>;
}

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="grid gap-1.5"><FieldLabel>{label}</FieldLabel><Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function FormTextarea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return <label className="grid gap-1.5"><FieldLabel>{label}</FieldLabel><Textarea value={value} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} /></label>;
}

function applyEdit(data: ResumeData, action: ResumeEditAction): ResumeData {
  switch (action.type) {
    case "basics": return { ...data, basics: { ...data.basics, [action.field]: action.value } };
    case "experience": return { ...data, experience: data.experience.map((item) => item.id === action.id ? { ...item, [action.field]: action.value } : item) };
    case "experience-highlight": return { ...data, experience: data.experience.map((item) => item.id === action.id ? { ...item, highlights: item.highlights.map((highlight, index) => index === action.index ? action.value : highlight) } : item) };
    case "experience-highlights": return { ...data, experience: data.experience.map((item) => item.id === action.id ? { ...item, highlights: action.value } : item) };
    case "education": return { ...data, education: data.education.map((item) => item.id === action.id ? { ...item, [action.field]: action.value } : item) };
    case "publication": return { ...data, publications: data.publications.map((item) => item.id === action.id ? { ...item, [action.field]: action.value } : item) };
    case "project": return { ...data, projects: data.projects.map((item) => item.id === action.id ? { ...item, [action.field]: action.value } : item) };
    case "skill": return { ...data, skills: data.skills.map((skill, index) => index === action.index ? action.value : skill) };
    case "custom-item": return data;
  }
}

function removeData(data: ResumeData, action: ResumeDeleteAction): ResumeData {
  switch (action.type) {
    case "experience": return { ...data, experience: data.experience.filter((item) => item.id !== action.id) };
    case "experience-highlight": return { ...data, experience: data.experience.map((item) => item.id === action.id ? { ...item, highlights: item.highlights.filter((_, index) => index !== action.index) } : item) };
    case "education": return { ...data, education: data.education.filter((item) => item.id !== action.id) };
    case "publication": return { ...data, publications: data.publications.filter((item) => item.id !== action.id) };
    case "project": return { ...data, projects: data.projects.filter((item) => item.id !== action.id) };
    case "skill": return { ...data, skills: data.skills.filter((_, index) => index !== action.index) };
    case "custom-item": return data;
  }
}

function clearSection(data: ResumeData, section: Exclude<ResumeSectionId, "basics">): ResumeData {
  if (section === "experience") return { ...data, experience: [] };
  if (section === "education") return { ...data, education: [] };
  if (section === "publications") return { ...data, publications: [] };
  if (section === "projects") return { ...data, projects: [] };
  return { ...data, skills: [] };
}

function enableSectionsWithContent(state: ResumeState, data: ResumeData): ResumeState["sectionSettings"] {
  return {
    ...state.sectionSettings,
    basics: { ...state.sectionSettings.basics, enabled: true },
    experience: { ...state.sectionSettings.experience, enabled: state.sectionSettings.experience.enabled || data.experience.length > 0 },
    education: { ...state.sectionSettings.education, enabled: state.sectionSettings.education.enabled || data.education.length > 0 },
    publications: { ...state.sectionSettings.publications, enabled: state.sectionSettings.publications.enabled || data.publications.length > 0 },
    projects: { ...state.sectionSettings.projects, enabled: state.sectionSettings.projects.enabled || data.projects.length > 0 },
    skills: { ...state.sectionSettings.skills, enabled: state.sectionSettings.skills.enabled || data.skills.length > 0 },
  };
}

function sectionCount(data: ResumeData, section: ResumeSectionId) {
  if (section === "basics") return data.basics.name || data.basics.summary ? 1 : 0;
  return data[section].length;
}

function EditInspector({ data, customSections, selection, commit }: { data: ResumeData; customSections: CustomSection[]; selection: EditorSelection; commit: (action: ResumeEditAction) => void }) {
  const entry = selection.entryId;
  if (selection.section === "custom") {
    const section = customSections.find((item) => item.id === selection.sectionId);
    const item = section?.items.find((row) => row.id === entry);
    if (!section || !item) return <EmptyInspector section={section?.title || "custom section"} />;
    return <div className="inspector-form"><InspectorHeading title={section.title} description="Edit this custom section item as plain text." />
      <FormTextarea label="Item text" rows={8} value={item.text} onChange={(value) => commit({ type: "custom-item", sectionId: section.id, id: item.id, value })} />
    </div>;
  }
  if (selection.section === "basics") {
    return <div className="inspector-form">
      <InspectorHeading title="Profile & contact" description="Changes here update the document immediately." />
      <FormField label="Full name" value={data.basics.name} onChange={(value) => commit({ type: "basics", field: "name", value })} />
      <FormField label="Professional headline" value={data.basics.headline} onChange={(value) => commit({ type: "basics", field: "headline", value })} />
      <div className="grid grid-cols-2 gap-3"><FormField label="Email" type="email" value={data.basics.email} onChange={(value) => commit({ type: "basics", field: "email", value })} /><FormField label="Phone" value={data.basics.phone} onChange={(value) => commit({ type: "basics", field: "phone", value })} /></div>
      <FormField label="Location" value={data.basics.location} onChange={(value) => commit({ type: "basics", field: "location", value })} />
      <FormField label="Website / LinkedIn" value={data.basics.website} onChange={(value) => commit({ type: "basics", field: "website", value })} />
      <FormTextarea label="Professional summary" value={data.basics.summary} onChange={(value) => commit({ type: "basics", field: "summary", value })} />
    </div>;
  }
  if (selection.section === "experience") {
    const item = data.experience.find((row) => row.id === entry);
    if (!item) return <EmptyInspector section="experience" />;
    return <div className="inspector-form"><InspectorHeading title="Experience" description="Edit dates and bullet details precisely." />
      <FormField label="Company" value={item.company} onChange={(value) => commit({ type: "experience", id: item.id, field: "company", value })} />
      <FormField label="Role" value={item.role} onChange={(value) => commit({ type: "experience", id: item.id, field: "role", value })} />
      <FormField label="Location" value={item.location} onChange={(value) => commit({ type: "experience", id: item.id, field: "location", value })} />
      <div className="grid grid-cols-2 gap-3"><FormField label="Start" value={item.start} onChange={(value) => commit({ type: "experience", id: item.id, field: "start", value })} /><FormField label="End" value={item.end} onChange={(value) => commit({ type: "experience", id: item.id, field: "end", value })} /></div>
      <FormTextarea label="Highlights — one per line" rows={7} value={item.highlights.join("\n")} onChange={(value) => commit({ type: "experience-highlights", id: item.id, value: value.split("\n") })} />
    </div>;
  }
  if (selection.section === "education") {
    const item = data.education.find((row) => row.id === entry);
    if (!item) return <EmptyInspector section="education" />;
    return <div className="inspector-form"><InspectorHeading title="Education" description="Institution, qualification and dates." />
      <FormField label="Institution" value={item.school} onChange={(value) => commit({ type: "education", id: item.id, field: "school", value })} /><FormField label="Degree" value={item.degree} onChange={(value) => commit({ type: "education", id: item.id, field: "degree", value })} /><FormField label="Field of study" value={item.field} onChange={(value) => commit({ type: "education", id: item.id, field: "field", value })} /><FormField label="Location" value={item.location} onChange={(value) => commit({ type: "education", id: item.id, field: "location", value })} /><div className="grid grid-cols-2 gap-3"><FormField label="Start" value={item.start} onChange={(value) => commit({ type: "education", id: item.id, field: "start", value })} /><FormField label="End" value={item.end} onChange={(value) => commit({ type: "education", id: item.id, field: "end", value })} /></div><FormTextarea label="Details" value={item.details} onChange={(value) => commit({ type: "education", id: item.id, field: "details", value })} />
    </div>;
  }
  if (selection.section === "publications") {
    const item = data.publications.find((row) => row.id === entry);
    if (!item) return <EmptyInspector section="publication" />;
    return <div className="inspector-form"><InspectorHeading title="Publication" description="Use the exact citation and canonical URL." />
      <FormField label="Title" value={item.title} onChange={(value) => commit({ type: "publication", id: item.id, field: "title", value })} /><FormField label="Authors" value={item.authors} onChange={(value) => commit({ type: "publication", id: item.id, field: "authors", value })} /><FormField label="Venue / Journal" value={item.venue} onChange={(value) => commit({ type: "publication", id: item.id, field: "venue", value })} /><FormField label="Year" value={item.year} onChange={(value) => commit({ type: "publication", id: item.id, field: "year", value })} /><FormField label="DOI / URL" value={item.url} onChange={(value) => commit({ type: "publication", id: item.id, field: "url", value })} />
    </div>;
  }
  if (selection.section === "projects") {
    const item = data.projects.find((row) => row.id === entry);
    if (!item) return <EmptyInspector section="project" />;
    return <div className="inspector-form"><InspectorHeading title="Project" description="Clarify your role and measurable outcome." />
      <FormField label="Project name" value={item.name} onChange={(value) => commit({ type: "project", id: item.id, field: "name", value })} /><FormField label="Role" value={item.role} onChange={(value) => commit({ type: "project", id: item.id, field: "role", value })} /><FormField label="Date" value={item.date} onChange={(value) => commit({ type: "project", id: item.id, field: "date", value })} /><FormField label="URL" value={item.url} onChange={(value) => commit({ type: "project", id: item.id, field: "url", value })} /><FormTextarea label="Description" value={item.description} onChange={(value) => commit({ type: "project", id: item.id, field: "description", value })} />
    </div>;
  }
  return <div className="inspector-form"><InspectorHeading title="Skills" description="Click a skill in the CV for single-item editing." />
    {data.skills.map((skill, index) => <FormField key={`${index}-${skill}`} label={`Skill ${index + 1}`} value={skill} onChange={(value) => commit({ type: "skill", index, value })} />)}
  </div>;
}

function InspectorHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-1"><h2 className="text-base font-semibold tracking-tight">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>;
}

function EmptyInspector({ section }: { section: string }) {
  return <div className="grid min-h-48 place-items-center px-6 text-center"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-muted"><Plus className="size-4" /></div><p className="font-medium">No {section} selected</p><p className="mt-1 text-xs text-muted-foreground">Choose an item on the CV or add one from the section controls.</p></div></div>;
}

type InspectorProps = {
  state: ResumeState;
  setState: React.Dispatch<React.SetStateAction<ResumeState>>;
  selection: EditorSelection;
  tab: InspectorTab;
  setTab: (tab: InspectorTab) => void;
  importedText: string;
  setImportedText: (value: string) => void;
  aiStatus: AIStatus;
  runAI: (action: "parse" | "improve") => void;
  commit: (action: ResumeEditAction) => void;
  confirmEntryDeletes: boolean;
  onEnableDeleteConfirmations: () => void;
};

function Inspector({ state, setState, selection, tab, setTab, importedText, setImportedText, aiStatus, runAI, commit, confirmEntryDeletes, onEnableDeleteConfirmations }: InspectorProps) {
  return <Tabs value={tab} onValueChange={(value) => setTab(value as InspectorTab)} className="h-full gap-0">
    <div className="border-b px-3 py-2"><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="edit">Edit</TabsTrigger><TabsTrigger value="ai">AI</TabsTrigger><TabsTrigger value="design">Design</TabsTrigger><TabsTrigger value="export">Export</TabsTrigger></TabsList></div>
    <ScrollArea className="min-h-0 flex-1">
      <TabsContent value="edit" className="p-4"><EditInspector data={state.data} customSections={state.customSections} selection={selection} commit={commit} />
        {!confirmEntryDeletes && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><strong className="block">Entry deletion confirmations are off.</strong><Button type="button" variant="link" size="xs" className="mt-1 h-auto p-0 text-amber-950" onClick={onEnableDeleteConfirmations}>Turn confirmations back on</Button></div>}
      </TabsContent>
      <TabsContent value="ai" className="p-4"><div className="inspector-form"><InspectorHeading title="AI assistant" description="Parse an existing draft or improve only the facts already present." />
        <label className="grid gap-1.5"><FieldLabel>Provider</FieldLabel><Select value={state.provider} onValueChange={(value) => setState((current) => ({ ...current, provider: value as ProviderId }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="deepseek">DeepSeek</SelectItem><SelectItem value="kimi">Kimi</SelectItem></SelectContent></Select></label>
        <FormTextarea label="Resume source text" rows={8} value={importedText} onChange={setImportedText} placeholder="Paste a current resume to parse…" />
        <Button onClick={() => runAI("parse")} disabled={!importedText.trim() || aiStatus.kind === "loading"}>{aiStatus.kind === "loading" ? <Loader2 className="animate-spin" /> : <Sparkles />} Parse into CV</Button>
        <Separator />
        <FormTextarea label="Target job description (optional)" rows={8} value={state.jobDescription} onChange={(value) => setState((current) => ({ ...current, jobDescription: value }))} placeholder="Paste the role description…" />
        <Button variant="outline" onClick={() => runAI("improve")} disabled={aiStatus.kind === "loading"}><Sparkles /> Improve wording</Button>
        {aiStatus.message && <p role="status" className={cn("rounded-lg border p-3 text-xs leading-5", aiStatus.kind === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "bg-muted text-muted-foreground")}>{aiStatus.message}</p>}
        <p className="text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">Truth guardrail:</strong> AI is instructed not to invent employers, dates, qualifications, publications or metrics. Review every edit.</p>
      </div></TabsContent>
      <TabsContent value="design" className="p-4"><div className="inspector-form"><InspectorHeading title="Document design" description="Choose a professional, single-column A4 layout." />
        <label className="grid gap-1.5"><FieldLabel>CV font</FieldLabel><Select value={state.font} onValueChange={(value) => setState((current) => ({ ...current, font: value as ResumeFontId }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{fontOptions.map((font) => <SelectItem key={font.id} value={font.id}><span style={{ fontFamily: font.stack }}>{font.name}</span></SelectItem>)}</SelectContent></Select></label>
        <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground"><p style={{ fontFamily: fontOptions.find((font) => font.id === state.font)?.stack }}>The quick brown fox jumps over the lazy dog.</p><p className="mt-2">Fonts use your device&apos;s installed typefaces with ATS-safe fallbacks. <a href="https://resumeworded.com/blog/ats-font/" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">ATS font guide ↗</a></p></div>
        <Separator />
        <FieldLabel>CV template</FieldLabel>
        {templates.map((template) => <button type="button" key={template.id} className={cn("template-option", state.template === template.id && "is-active")} onClick={() => setState((current) => ({ ...current, template: template.id }))}><span className={`template-miniature miniature-${template.id}`}><i /><i /><i /><i /></span><span className="min-w-0 text-left"><strong className="block text-sm">{template.name}</strong><small className="mt-1 block text-xs leading-4 text-muted-foreground">{template.description}</small><a href={template.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-medium text-primary" onClick={(event) => event.stopPropagation()}>{template.sourceLabel} ↗</a></span>{state.template === template.id && <Check className="ml-auto size-4 shrink-0 text-primary" />}</button>)}
        <p className="text-[11px] leading-5 text-muted-foreground">Names identify layout inspiration only. RadishCV is not affiliated with MIT, Harvard or Yale.</p>
      </div></TabsContent>
      <TabsContent value="export" className="p-4"><ExportPanel state={state} /></TabsContent>
    </ScrollArea>
  </Tabs>;
}

function ExportPanel({ state }: { state: ResumeState }) {
  return <div className="inspector-form"><InspectorHeading title="Export CV" description="PDF stays selectable; TXT is ATS-friendly; JSON is your editable backup." />
    <Button className="justify-start" onClick={() => window.print()}><FileDown /> Save as PDF</Button>
    <Button variant="outline" className="justify-start" onClick={() => downloadText(state)}><FileText /> Download TXT</Button>
    <Button variant="outline" className="justify-start" onClick={() => downloadJson(state)}><FileJson /> Download JSON</Button>
    <div className="rounded-lg border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Private by default.</strong> Your structured resume is stored in this browser. Only explicit AI actions send text to your configured provider.</div>
  </div>;
}

export function ResumeBuilder() {
  const [state, setState] = useState<ResumeState>(initialState);
  const [selection, setSelection] = useState<EditorSelection>({ section: "basics", field: "name" });
  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("edit");
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [customSectionTitle, setCustomSectionTitle] = useState("");
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ResumeDeleteAction | null>(null);
  const [pendingSectionDelete, setPendingSectionDelete] = useState<SectionDeleteTarget | null>(null);
  const [disableFutureDeleteWarning, setDisableFutureDeleteWarning] = useState(false);
  const [confirmEntryDeletes, setConfirmEntryDeletes] = useState(true);
  const [importedText, setImportedText] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const [aiStatus, setAiStatus] = useState<AIStatus>({ kind: "idle", message: "" });
  const hydrated = useRef(false);
  const preferencesHydrated = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setState(normalizeState(JSON.parse(saved), initialState));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        hydrated.current = true;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { confirmEntryDeletes?: unknown };
          if (typeof parsed.confirmEntryDeletes === "boolean") setConfirmEntryDeletes(parsed.confirmEntryDeletes);
        }
      } catch {
        localStorage.removeItem(PREFERENCES_KEY);
      } finally {
        preferencesHydrated.current = true;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (preferencesHydrated.current) localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ confirmEntryDeletes }));
  }, [confirmEntryDeletes]);

  const setData = (updater: (data: ResumeData) => ResumeData) => setState((current) => ({ ...current, data: updater(current.data) }));
  const commit = (action: ResumeEditAction) => {
    if (action.type === "custom-item") {
      setState((current) => ({ ...current, customSections: current.customSections.map((section) => section.id === action.sectionId ? { ...section, items: section.items.map((item) => item.id === action.id ? { ...item, text: action.value } : item) } : section) }));
      return;
    }
    setData((data) => applyEdit(data, action));
  };

  function select(next: EditorSelection) {
    setSelection(next);
    setInspectorTab("edit");
  }

  function scrollTo(section: ResumeSectionId) {
    const firstEntry = section === "experience" || section === "education" || section === "publications" || section === "projects" ? state.data[section][0]?.id : undefined;
    setSelection((current) => ({ section, entryId: current.section === section ? current.entryId || firstEntry : firstEntry }));
    setInspectorTab("edit");
    requestAnimationFrame(() => document.getElementById(`cv-section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function scrollToCustom(section: CustomSection) {
    const firstEntry = section.items[0]?.id;
    setSelection({ section: "custom", sectionId: section.id, entryId: firstEntry, field: firstEntry ? "text" : undefined });
    setInspectorTab("edit");
    requestAnimationFrame(() => document.getElementById(`cv-section-custom-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function requestFocus(key: string) {
    setFocusRequest((current) => ({ key, nonce: (current?.nonce ?? 0) + 1 }));
  }

  function addSection(section: ResumeSectionId) {
    if (section === "experience" || section === "education") add({ type: section });
    if (section === "projects") add({ type: "project" });
    if (section === "publications") add({ type: "publication" });
    if (section === "skills") add({ type: "skill" });
  }

  function add(action: ResumeAddAction) {
    if (action.type === "experience") {
      const id = createId();
      setData((data) => ({ ...data, experience: [...data.experience, { id, company: "", role: "", location: "", start: "", end: "", highlights: [] }] }));
      setSelection({ section: "experience", entryId: id, field: "role" }); requestFocus(`experience.${id}.role`);
    } else if (action.type === "experience-highlight") {
      let index = 0;
      setData((data) => ({ ...data, experience: data.experience.map((item) => { if (item.id !== action.id) return item; index = item.highlights.length; return { ...item, highlights: [...item.highlights, ""] }; }) }));
      setSelection({ section: "experience", entryId: action.id, field: "highlights", index }); requestFocus(`experience.${action.id}.highlight.${index}`);
    } else if (action.type === "education") {
      const id = createId(); setData((data) => ({ ...data, education: [...data.education, { id, school: "", degree: "", field: "", location: "", start: "", end: "", details: "" }] })); setSelection({ section: "education", entryId: id, field: "school" }); requestFocus(`education.${id}.school`);
    } else if (action.type === "publication") {
      const id = createId(); setData((data) => ({ ...data, publications: [...data.publications, { id, title: "", authors: "", venue: "", year: "", url: "" }] })); setSelection({ section: "publications", entryId: id, field: "title" }); requestFocus(`publications.${id}.title`);
    } else if (action.type === "project") {
      const id = createId(); setData((data) => ({ ...data, projects: [...data.projects, { id, name: "", role: "", date: "", description: "", url: "" }] })); setSelection({ section: "projects", entryId: id, field: "name" }); requestFocus(`projects.${id}.name`);
    } else if (action.type === "skill") {
      const index = state.data.skills.length; setData((data) => ({ ...data, skills: [...data.skills, ""] })); setSelection({ section: "skills", field: "skills", index }); requestFocus(`skills.${index}`);
    } else {
      const id = createId();
      setState((current) => ({ ...current, customSections: current.customSections.map((section) => section.id === action.sectionId ? { ...section, items: [...section.items, { id, text: "" }] } : section) }));
      setSelection({ section: "custom", sectionId: action.sectionId, entryId: id, field: "text" }); requestFocus(`custom.${action.sectionId}.${id}`);
    }
    setInspectorTab("edit");
  }

  function enableBuiltInSection(section: Exclude<ResumeSectionId, "basics">) {
    setState((current) => ({ ...current, sectionSettings: { ...current.sectionSettings, [section]: { ...current.sectionSettings[section], enabled: true } } }));
    setAddSectionOpen(false);
    addSection(section);
  }

  function createCustomSection() {
    const title = customSectionTitle.trim().slice(0, 60);
    if (!title) return;
    const sectionId = createId();
    const itemId = createId();
    setState((current) => ({ ...current, customSections: [...current.customSections, { id: sectionId, title, items: [{ id: itemId, text: "" }] }] }));
    setCustomSectionTitle(""); setAddSectionOpen(false);
    setSelection({ section: "custom", sectionId, entryId: itemId, field: "text" }); requestFocus(`custom.${sectionId}.${itemId}`); setInspectorTab("edit");
  }

  function openRename(target: RenameTarget, value: string) {
    setRenameTarget(target); setRenameValue(value);
  }

  function saveRename() {
    const title = renameValue.trim().slice(0, 60);
    if (!renameTarget || !title) return;
    if (renameTarget.type === "built-in") {
      setState((current) => ({ ...current, sectionSettings: { ...current.sectionSettings, [renameTarget.id]: { ...current.sectionSettings[renameTarget.id], title } } }));
    } else {
      setState((current) => ({ ...current, customSections: current.customSections.map((section) => section.id === renameTarget.id ? { ...section, title } : section) }));
    }
    setRenameTarget(null); setRenameValue("");
  }

  function performDelete(action: ResumeDeleteAction) {
    if (action.type === "custom-item") {
      setState((current) => ({ ...current, customSections: current.customSections.map((section) => section.id === action.sectionId ? { ...section, items: section.items.filter((item) => item.id !== action.id) } : section) }));
      if (selection.section === "custom" && selection.sectionId === action.sectionId && selection.entryId === action.id) setSelection({ section: "custom", sectionId: action.sectionId });
      return;
    }
    setData((data) => removeData(data, action));
  }

  function requestDelete(action: ResumeDeleteAction) {
    if (action.type === "experience-highlight" || action.type === "skill") {
      performDelete(action);
      return;
    }
    if (!confirmEntryDeletes) {
      performDelete(action); toast.success("Entry deleted"); return;
    }
    setDisableFutureDeleteWarning(false); setPendingDelete(action);
  }

  function removeSection(target: SectionDeleteTarget) {
    if (target.type === "custom") {
      setState((current) => ({ ...current, customSections: current.customSections.filter((section) => section.id !== target.id) }));
    } else {
      setState((current) => ({ ...current, data: clearSection(current.data, target.id), sectionSettings: { ...current.sectionSettings, [target.id]: { ...current.sectionSettings[target.id], enabled: false } } }));
    }
    setSelection({ section: "basics", field: "name" }); setInspectorTab("edit"); setPendingSectionDelete(null); toast.success("Section removed");
  }

  async function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 250_000) { toast.error("文件超过 250 KB，请上传纯文本版本。"); return; }
    const content = await file.text();
    setUploadedName(file.name);
    if (file.name.toLowerCase().endsWith(".json")) {
      try {
        const parsed = JSON.parse(content) as unknown;
        if (parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed) {
          setState((current) => {
            const restored = normalizeState({ ...current, ...(parsed as Record<string, unknown>), provider: current.provider, jobDescription: current.jobDescription }, current);
            return restored;
          });
        } else {
          const data = normalizeResume(parsed && typeof parsed === "object" && "data" in parsed ? (parsed as { data: unknown }).data : parsed);
          setState((current) => ({ ...current, data, sectionSettings: createDefaultSectionSettings(), customSections: [] }));
        }
        setImportOpen(false); toast.success("JSON 简历已载入"); return;
      } catch { toast.error("JSON 文件格式无效"); return; }
    }
    setImportedText(content.slice(0, 40_000));
    setImportOpen(false); setInspectorTab("ai"); setMobileToolsOpen(true); toast.success("文本已读取，可用 AI 解析到 CV");
  }

  async function runAI(action: "parse" | "improve") {
    setAiStatus({ kind: "loading", message: action === "parse" ? "正在识别简历结构…" : "正在优化表达…" });
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, provider: state.provider, sourceText: importedText, resume: state.data, jobDescription: state.jobDescription }) });
      const payload = await response.json() as { resume?: ResumeData; error?: string; detail?: string; model?: string };
      if (!response.ok || !payload.resume) throw new Error(payload.error || payload.detail || "AI request failed");
      const nextData = normalizeResume(payload.resume);
      setState((current) => ({ ...current, data: nextData, sectionSettings: action === "parse" ? enableSectionsWithContent(current, nextData) : current.sectionSettings }));
      const message = `${action === "parse" ? "解析" : "优化"}完成 · ${payload.model || state.provider}`;
      setAiStatus({ kind: "success", message }); toast.success(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 请求失败。";
      setAiStatus({ kind: "error", message }); toast.error(message);
    }
  }

  function resetResume() {
    setState((current) => ({ ...current, data: structuredClone(emptyResume), jobDescription: "", sectionSettings: createDefaultSectionSettings(), customSections: [] }));
    setImportedText(""); setUploadedName(""); setSelection({ section: "basics", field: "name" }); requestFocus("basics.name"); setAiStatus({ kind: "idle", message: "" }); setResetOpen(false); toast.success("已恢复为空白简历");
  }

  const counts = useMemo(() => Object.fromEntries(sectionMeta.map(({ id }) => [id, sectionCount(state.data, id)])) as Record<ResumeSectionId, number>, [state.data]);
  const inspectorProps: InspectorProps = { state, setState, selection, tab: inspectorTab, setTab: setInspectorTab, importedText, setImportedText, aiStatus, runAI, commit, confirmEntryDeletes, onEnableDeleteConfirmations: () => { setConfirmEntryDeletes(true); toast.success("Entry deletion confirmations restored"); } };
  const missingSections = sectionMeta.filter(({ id }) => id !== "basics" && !state.sectionSettings[id].enabled);
  const sectionDeleteTitle = pendingSectionDelete?.type === "custom"
    ? state.customSections.find((section) => section.id === pendingSectionDelete.id)?.title
    : pendingSectionDelete ? state.sectionSettings[pendingSectionDelete.id].title : "";
  const sectionDeleteCount = pendingSectionDelete?.type === "custom"
    ? state.customSections.find((section) => section.id === pendingSectionDelete.id)?.items.length || 0
    : pendingSectionDelete ? counts[pendingSectionDelete.id] : 0;

  return <SidebarProvider style={{ "--sidebar-width": "14.5rem" } as React.CSSProperties}>
    <Sidebar className="print:hidden" collapsible="icon">
      <SidebarHeader className="border-b p-4 group-data-[collapsible=icon]:p-1.5"><div className="flex items-center gap-2.5"><Image src="/icons/resume-rabbit.png" alt="RadishCV rabbit" width={36} height={36} className="size-9 shrink-0 object-contain" priority /><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-sm font-semibold">RadishCV</p><p className="text-[10px] text-muted-foreground">Editable CV workspace</p></div></div></SidebarHeader>
      <SidebarContent>
        <SidebarGroup><Tooltip><TooltipTrigger asChild><Button className="w-full justify-start group-data-[collapsible=icon]:px-2" onClick={() => setImportOpen(true)}><Upload /><span className="group-data-[collapsible=icon]:hidden">Import resume</span></Button></TooltipTrigger><TooltipContent side="right">Import resume</TooltipContent></Tooltip></SidebarGroup>
        <SidebarGroup><SidebarGroupLabel>Resume sections</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
          {sectionMeta.filter(({ id }) => state.sectionSettings[id].enabled).map(({ id, icon: Icon }) => {
            const title = state.sectionSettings[id].title;
            return <SidebarMenuItem key={id} className="group/section"><SidebarMenuButton tooltip={title} aria-label={title} className="group-data-[collapsible=icon]:pr-2 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:[&>span]:hidden pr-20" isActive={selection.section === id} onClick={() => scrollTo(id)}><Icon /><span className="truncate">{title}</span></SidebarMenuButton><SidebarMenuBadge className="group-hover/section:hidden group-focus-within/section:hidden group-data-[collapsible=icon]:hidden">{counts[id]}</SidebarMenuBadge><div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100 group-data-[collapsible=icon]:hidden">
              {id !== "basics" && <Button type="button" variant="ghost" size="icon-xs" aria-label={`Add ${title} item`} onClick={() => addSection(id)}><Plus /></Button>}
              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Rename ${title}`} onClick={() => openRename({ type: "built-in", id }, title)}><Pencil /></Button>
              {id !== "basics" && <Button type="button" variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" aria-label={`Remove ${title} section`} onClick={() => setPendingSectionDelete({ type: "built-in", id })}><Minus /></Button>}
            </div></SidebarMenuItem>;
          })}
          {state.customSections.map((section) => <SidebarMenuItem key={section.id} className="group/section"><SidebarMenuButton tooltip={section.title} aria-label={section.title} className="group-data-[collapsible=icon]:pr-2 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:[&>span]:hidden pr-20" isActive={selection.section === "custom" && selection.sectionId === section.id} onClick={() => scrollToCustom(section)}><ListPlus /><span className="truncate">{section.title}</span></SidebarMenuButton><SidebarMenuBadge className="group-hover/section:hidden group-focus-within/section:hidden group-data-[collapsible=icon]:hidden">{section.items.length}</SidebarMenuBadge><div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100 group-data-[collapsible=icon]:hidden">
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Add ${section.title} item`} onClick={() => add({ type: "custom-item", sectionId: section.id })}><Plus /></Button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Rename ${section.title}`} onClick={() => openRename({ type: "custom", id: section.id }, section.title)}><Pencil /></Button>
            <Button type="button" variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" aria-label={`Remove ${section.title} section`} onClick={() => setPendingSectionDelete({ type: "custom", id: section.id })}><Minus /></Button>
          </div></SidebarMenuItem>)}
        </SidebarMenu><Button type="button" variant="outline" aria-label="Add resume section" className="mt-3 w-full justify-start group-data-[collapsible=icon]:px-2" onClick={() => setAddSectionOpen(true)}><Plus /><span className="group-data-[collapsible=icon]:hidden">Add section</span></Button></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3 group-data-[collapsible=icon]:p-1.5"><Popover><PopoverTrigger asChild><button className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-muted-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" /><span className="group-data-[collapsible=icon]:hidden"><strong className="block text-foreground">Saved locally</strong>Stored as structured data in this browser.</span></button></PopoverTrigger><PopoverContent side="right" className="w-72 text-xs leading-5">Only explicit AI actions send text to Kimi or DeepSeek. The editable DOM is never saved.</PopoverContent></Popover></SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset className="min-w-0 overflow-hidden bg-[#f4f5f7]">
      <header data-print-hidden="true" className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2"><Tooltip><TooltipTrigger asChild><SidebarTrigger /></TooltipTrigger><TooltipContent>Toggle sidebar</TooltipContent></Tooltip><div className="hidden items-center gap-2 md:flex"><Badge variant="outline">A4</Badge><span className="truncate text-xs text-muted-foreground">{templates.find((template) => template.id === state.template)?.name}</span></div></div>
        <div className="flex items-center gap-1.5">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setResetOpen(true)}><RefreshCcw /></Button></TooltipTrigger><TooltipContent>Reset resume</TooltipContent></Tooltip>
          <Button variant="outline" className="lg:hidden" onClick={() => setMobileToolsOpen(true)}><Settings2 /> Tools</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button><Download /> Export <ChevronDown /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Export CV</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => window.print()}><FileDown /> PDF via print dialog</DropdownMenuItem><DropdownMenuItem onClick={() => downloadText(state)}><FileText /> ATS-friendly TXT</DropdownMenuItem><DropdownMenuItem onClick={() => downloadJson(state)}><FileJson /> Editable JSON</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <div className="h-full lg:hidden"><ScrollArea className="h-[calc(100svh-3.5rem)]"><div className="canvas-stage"><ResumePreview data={state.data} template={state.template} font={state.font} sectionSettings={state.sectionSettings} customSections={state.customSections} editable selection={selection} focusRequest={focusRequest} onSelect={select} onCommit={commit} onAdd={add} onDelete={requestDelete} /></div></ScrollArea></div>
        <ResizablePanelGroup orientation="horizontal" className="hidden h-[calc(100svh-3.5rem)] lg:flex">
          <ResizablePanel defaultSize="70" minSize="52"><ScrollArea className="h-full"><div className="canvas-stage"><ResumePreview data={state.data} template={state.template} font={state.font} sectionSettings={state.sectionSettings} customSections={state.customSections} editable selection={selection} focusRequest={focusRequest} onSelect={select} onCommit={commit} onAdd={add} onDelete={requestDelete} /></div></ScrollArea></ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={336} minSize={300} maxSize={440} className="bg-white"><Inspector {...inspectorProps} /></ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarInset>

    <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}><SheetContent className="w-[min(92vw,380px)] gap-0 p-0"><SheetHeader className="border-b"><SheetTitle>Resume tools</SheetTitle><SheetDescription>Edit, AI, design and export controls.</SheetDescription></SheetHeader><div className="min-h-0 flex-1"><Inspector {...inspectorProps} /></div></SheetContent></Sheet>

    <Dialog open={importOpen} onOpenChange={setImportOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Import resume</DialogTitle><DialogDescription>Upload plain text, Markdown or an exported JSON backup. Third-party PDF parsing is not included.</DialogDescription></DialogHeader>
      <input ref={fileInput} type="file" accept=".txt,.md,.json,text/plain,application/json" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
      <button type="button" className="import-dropzone" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]); }}><Upload className="size-5 text-primary" /><strong>Drop a file or browse</strong><span>.txt · .md · .json, up to 250 KB</span>{uploadedName && <Badge variant="secondary">{uploadedName}</Badge>}</button>
      <div className="relative"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-[10px] uppercase text-muted-foreground">or paste</span></div>
      <Textarea rows={9} value={importedText} onChange={(event) => setImportedText(event.target.value)} placeholder="Paste your current resume text…" />
      <DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button disabled={!importedText.trim()} onClick={() => { setImportOpen(false); setInspectorTab("ai"); setMobileToolsOpen(true); }}><Sparkles /> Continue to AI</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={addSectionOpen} onOpenChange={(open) => { setAddSectionOpen(open); if (!open) setCustomSectionTitle(""); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Add a resume section</DialogTitle><DialogDescription>Restore one missing standard section or create a free-text custom section.</DialogDescription></DialogHeader>
      <div className="grid gap-2 sm:grid-cols-2">{missingSections.map(({ id, label, icon: Icon }) => <button type="button" key={id} className="flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5" onClick={() => enableBuiltInSection(id as Exclude<ResumeSectionId, "basics">)}><Icon className="size-4 text-primary" /><span><strong className="block">{label}</strong><small className="text-muted-foreground">Structured section</small></span></button>)}</div>
      {!missingSections.length && <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">All standard section types are already active.</p>}
      <Separator />
      <label className="grid gap-1.5"><FieldLabel>Custom section name</FieldLabel><Input value={customSectionTitle} maxLength={60} placeholder="Awards, Certifications, Languages…" onChange={(event) => setCustomSectionTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && customSectionTitle.trim()) createCustomSection(); }} /></label>
      <DialogFooter><Button variant="outline" onClick={() => setAddSectionOpen(false)}>Cancel</Button><Button disabled={!customSectionTitle.trim()} onClick={createCustomSection}><Plus /> Add custom section</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => { if (!open) { setRenameTarget(null); setRenameValue(""); } }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Rename section</DialogTitle><DialogDescription>The display name updates in the sidebar, CV and exports. Its structured data type remains unchanged.</DialogDescription></DialogHeader><label className="grid gap-1.5"><FieldLabel>Section name</FieldLabel><Input value={renameValue} maxLength={60} autoFocus onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && renameValue.trim()) saveRename(); }} /></label><DialogFooter><Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button><Button disabled={!renameValue.trim()} onClick={saveRename}>Save name</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDisableFutureDeleteWarning(false); } }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this resume entry?</AlertDialogTitle><AlertDialogDescription>This removes the complete entry from the CV. You cannot undo it after confirming.</AlertDialogDescription></AlertDialogHeader><label className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm"><Checkbox checked={disableFutureDeleteWarning} onCheckedChange={(checked) => setDisableFutureDeleteWarning(checked === true)} aria-label="Don't ask again for entry deletions" /><span><strong className="block font-medium">Don&apos;t ask again for entry deletions</strong><small className="text-muted-foreground">Section removal and Reset will still require confirmation.</small></span></label><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (pendingDelete) performDelete(pendingDelete); if (disableFutureDeleteWarning) setConfirmEntryDeletes(false); setPendingDelete(null); setDisableFutureDeleteWarning(false); }}>Delete entry</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(pendingSectionDelete)} onOpenChange={(open) => !open && setPendingSectionDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove “{sectionDeleteTitle}”?</AlertDialogTitle><AlertDialogDescription>This permanently removes the entire section and all {sectionDeleteCount} {sectionDeleteCount === 1 ? "item" : "items"} from this CV. Re-adding the section starts empty.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => pendingSectionDelete && removeSection(pendingSectionDelete)}>Remove section</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset to a blank resume?</AlertDialogTitle><AlertDialogDescription>Your locally saved CV content will be cleared. Export JSON first if you need a backup.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={resetResume}>Reset resume</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarProvider>;
}
