"use client";

import { Plus, Trash2 } from "lucide-react";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EditorSelection,
  ResumeAddAction,
  ResumeData,
  ResumeDeleteAction,
  ResumeEditAction,
  ResumeFontId,
  ResumeSectionId,
  TemplateId,
} from "@/lib/types";

type Props = {
  data: ResumeData;
  template: TemplateId;
  font: ResumeFontId;
  editable?: boolean;
  selection?: EditorSelection;
  focusRequest?: { key: string; nonce: number } | null;
  onSelect?: (selection: EditorSelection) => void;
  onCommit?: (action: ResumeEditAction) => void;
  onAdd?: (action: ResumeAddAction) => void;
  onDelete?: (action: ResumeDeleteAction) => void;
};

const isSelected = (selection: EditorSelection | undefined, target: EditorSelection) =>
  selection?.section === target.section &&
  selection?.entryId === target.entryId &&
  selection?.field === target.field &&
  selection?.index === target.index;

function Section({ id, title, editable, empty, onSelect, onAdd, children }: {
  id: ResumeSectionId;
  title: string;
  editable?: boolean;
  empty?: boolean;
  onSelect?: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id === "basics" ? undefined : `cv-section-${id}`} data-empty-section={empty || undefined} className="cv-section scroll-mt-20" onClick={onSelect}>
      <div className="cv-section-title-row">
        <h2>{title}</h2>
        {editable && onAdd && (
          <Button type="button" variant="ghost" size="icon-xs" className="cv-editor-controls" aria-label={`Add ${title}`} onClick={(event) => { event.stopPropagation(); onAdd(); }}>
            <Plus />
          </Button>
        )}
      </div>
      <div className="cv-section-content">
        {empty && editable ? <p className="cv-empty">Click + to add {title.toLowerCase()}.</p> : children}
      </div>
    </section>
  );
}

export function ResumePreview({ data, template, font, editable = false, selection, focusRequest, onSelect = () => undefined, onCommit = () => undefined, onAdd = () => undefined, onDelete = () => undefined }: Props) {
  const field = (
    value: string,
    placeholder: string,
    label: string,
    target: EditorSelection,
    action: (value: string) => ResumeEditAction,
    options?: { multiline?: boolean; className?: string; editKey?: string },
  ) => {
    if (!editable) return value || null;
    return (
      <EditableText
        value={value}
        placeholder={placeholder}
        label={label}
        multiline={options?.multiline}
        className={options?.className}
        selected={isSelected(selection, target)}
        focusRequest={focusRequest && focusRequest.key === options?.editKey ? `${focusRequest.key}-${focusRequest.nonce}` : undefined}
        onSelect={() => onSelect(target)}
        onCommit={(next) => onCommit(action(next))}
      />
    );
  };

  const basicsTarget = (fieldName: keyof ResumeData["basics"]): EditorSelection => ({ section: "basics", field: fieldName });
  const visible = (hasContent: boolean) => editable || hasContent;

  return (
    <article id="resume-document" className={`resume-paper template-${template} resume-font-${font}`} aria-label="Editable resume document">
      <header id="cv-section-basics" className="cv-header scroll-mt-20" onClick={() => onSelect({ section: "basics" })}>
        <h1>{field(data.basics.name, "Your name", "Full name", basicsTarget("name"), (value) => ({ type: "basics", field: "name", value }), { editKey: "basics.name" }) || "Your name"}</h1>
        {visible(Boolean(data.basics.headline)) && <p className="cv-headline">{field(data.basics.headline, "Professional headline", "Professional headline", basicsTarget("headline"), (value) => ({ type: "basics", field: "headline", value }))}</p>}
        <p className="cv-contact">
          {(["email", "phone", "location", "website"] as const).map((key, index) => (
            <span className="cv-contact-item" data-empty={!data.basics[key] || undefined} key={key}>
              {index > 0 && data.basics[key] && (["email", "phone", "location", "website"] as const).slice(0, index).some((previous) => data.basics[previous]) && <span className="cv-contact-separator">·</span>}
              {field(data.basics[key], key === "website" ? "Website / LinkedIn" : key[0].toUpperCase() + key.slice(1), key, basicsTarget(key), (value) => ({ type: "basics", field: key, value }))}
            </span>
          ))}
        </p>
      </header>

      {visible(Boolean(data.basics.summary)) && (
        <Section id="basics" title="Profile" empty={!data.basics.summary} onSelect={() => onSelect({ section: "basics", field: "summary" })}>
          <p>{field(data.basics.summary, "Add a concise professional summary…", "Professional summary", basicsTarget("summary"), (value) => ({ type: "basics", field: "summary", value }), { multiline: true })}</p>
        </Section>
      )}

      {visible(data.experience.length > 0) && (
        <Section id="experience" title="Experience" editable={editable} empty={!data.experience.length} onSelect={() => onSelect({ section: "experience" })} onAdd={() => onAdd({ type: "experience" })}>
          {data.experience.map((item) => (
            <div data-empty-entry={!([item.company, item.role, item.location, item.start, item.end, ...item.highlights].some(Boolean)) || undefined} className={cn("cv-entry cv-editable-entry", selection?.entryId === item.id && "is-selected")} key={item.id} onClick={() => onSelect({ section: "experience", entryId: item.id })}>
              {editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-entry-delete cv-editor-controls" aria-label={`Delete ${item.role || "experience"}`} onClick={(event) => { event.stopPropagation(); onDelete({ type: "experience", id: item.id }); }}><Trash2 /></Button>}
              <div className="cv-entry-head">
                <div>
                  <h3>{field(item.role, "Role", "Experience role", { section: "experience", entryId: item.id, field: "role" }, (value) => ({ type: "experience", id: item.id, field: "role", value }), { editKey: `experience.${item.id}.role` }) || "Role"}</h3>
                  <p className="cv-subhead">{field(item.company, "Company", "Company", { section: "experience", entryId: item.id, field: "company" }, (value) => ({ type: "experience", id: item.id, field: "company", value }))}<span className="cv-inline-separator"> · </span>{field(item.location, "Location", "Experience location", { section: "experience", entryId: item.id, field: "location" }, (value) => ({ type: "experience", id: item.id, field: "location", value }))}</p>
                </div>
                <p className="cv-date">{field(item.start, "Start", "Experience start date", { section: "experience", entryId: item.id, field: "start" }, (value) => ({ type: "experience", id: item.id, field: "start", value }))}<span> – </span>{field(item.end, "End", "Experience end date", { section: "experience", entryId: item.id, field: "end" }, (value) => ({ type: "experience", id: item.id, field: "end", value }))}</p>
              </div>
              {visible(item.highlights.length > 0) && (
                <ul>
                  {item.highlights.map((highlight, index) => (
                    <li key={`${item.id}-${index}`}>{field(highlight, "Describe an outcome…", "Experience highlight", { section: "experience", entryId: item.id, field: "highlights", index }, (value) => ({ type: "experience-highlight", id: item.id, index, value }), { multiline: true, editKey: `experience.${item.id}.highlight.${index}` })}{editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-bullet-delete cv-editor-controls" aria-label="Delete highlight" onClick={(event) => { event.stopPropagation(); onDelete({ type: "experience-highlight", id: item.id, index }); }}><Trash2 /></Button>}</li>
                  ))}
                  {editable && <li className="cv-add-bullet cv-editor-controls"><button type="button" onClick={(event) => { event.stopPropagation(); onAdd({ type: "experience-highlight", id: item.id }); }}><Plus /> Add bullet</button></li>}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {visible(data.education.length > 0) && (
        <Section id="education" title="Education" editable={editable} empty={!data.education.length} onSelect={() => onSelect({ section: "education" })} onAdd={() => onAdd({ type: "education" })}>
          {data.education.map((item) => (
            <div data-empty-entry={!([item.school, item.degree, item.field, item.location, item.start, item.end, item.details].some(Boolean)) || undefined} className={cn("cv-entry cv-editable-entry", selection?.entryId === item.id && "is-selected")} key={item.id} onClick={() => onSelect({ section: "education", entryId: item.id })}>
              {editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-entry-delete cv-editor-controls" aria-label={`Delete ${item.school || "education"}`} onClick={(event) => { event.stopPropagation(); onDelete({ type: "education", id: item.id }); }}><Trash2 /></Button>}
              <div className="cv-entry-head">
                <div>
                  <h3>{field(item.school, "Institution", "Institution", { section: "education", entryId: item.id, field: "school" }, (value) => ({ type: "education", id: item.id, field: "school", value }), { editKey: `education.${item.id}.school` }) || "Institution"}</h3>
                  <p className="cv-subhead">{field(item.degree, "Degree", "Degree", { section: "education", entryId: item.id, field: "degree" }, (value) => ({ type: "education", id: item.id, field: "degree", value }))}<span>, </span>{field(item.field, "Field of study", "Field of study", { section: "education", entryId: item.id, field: "field" }, (value) => ({ type: "education", id: item.id, field: "field", value }))}</p>
                </div>
                <div className="cv-date"><p>{field(item.start, "Start", "Education start date", { section: "education", entryId: item.id, field: "start" }, (value) => ({ type: "education", id: item.id, field: "start", value }))}<span> – </span>{field(item.end, "End", "Education end date", { section: "education", entryId: item.id, field: "end" }, (value) => ({ type: "education", id: item.id, field: "end", value }))}</p><p>{field(item.location, "Location", "Education location", { section: "education", entryId: item.id, field: "location" }, (value) => ({ type: "education", id: item.id, field: "location", value }))}</p></div>
              </div>
              {visible(Boolean(item.details)) && <p>{field(item.details, "Honours, thesis, coursework…", "Education details", { section: "education", entryId: item.id, field: "details" }, (value) => ({ type: "education", id: item.id, field: "details", value }), { multiline: true })}</p>}
            </div>
          ))}
        </Section>
      )}

      {visible(data.publications.length > 0) && (
        <Section id="publications" title="Publications" editable={editable} empty={!data.publications.length} onSelect={() => onSelect({ section: "publications" })} onAdd={() => onAdd({ type: "publication" })}>
          {data.publications.map((item) => (
            <div data-empty-entry={!([item.authors, item.title, item.venue, item.year, item.url].some(Boolean)) || undefined} className={cn("cv-entry publication cv-editable-entry", selection?.entryId === item.id && "is-selected")} key={item.id} onClick={() => onSelect({ section: "publications", entryId: item.id })}>
              {editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-entry-delete cv-editor-controls" aria-label={`Delete ${item.title || "publication"}`} onClick={(event) => { event.stopPropagation(); onDelete({ type: "publication", id: item.id }); }}><Trash2 /></Button>}
              <p>{field(item.authors, "Authors", "Publication authors", { section: "publications", entryId: item.id, field: "authors" }, (value) => ({ type: "publication", id: item.id, field: "authors", value }))}{item.authors && <span>. </span>}<strong>{field(item.title, "Publication title", "Publication title", { section: "publications", entryId: item.id, field: "title" }, (value) => ({ type: "publication", id: item.id, field: "title", value }), { editKey: `publications.${item.id}.title` }) || "Publication title"}</strong>{item.title && (item.venue || item.year) && <span>. </span>}{field(item.venue, "Venue / Journal", "Publication venue", { section: "publications", entryId: item.id, field: "venue" }, (value) => ({ type: "publication", id: item.id, field: "venue", value }))}{item.venue && item.year && <span>, </span>}{field(item.year, "Year", "Publication year", { section: "publications", entryId: item.id, field: "year" }, (value) => ({ type: "publication", id: item.id, field: "year", value }))}</p>
              {visible(Boolean(item.url)) && <p className="cv-url">{field(item.url, "DOI / URL", "Publication URL", { section: "publications", entryId: item.id, field: "url" }, (value) => ({ type: "publication", id: item.id, field: "url", value }))}</p>}
            </div>
          ))}
        </Section>
      )}

      {visible(data.projects.length > 0) && (
        <Section id="projects" title="Selected Projects" editable={editable} empty={!data.projects.length} onSelect={() => onSelect({ section: "projects" })} onAdd={() => onAdd({ type: "project" })}>
          {data.projects.map((item) => (
            <div data-empty-entry={!([item.name, item.role, item.date, item.description, item.url].some(Boolean)) || undefined} className={cn("cv-entry cv-editable-entry", selection?.entryId === item.id && "is-selected")} key={item.id} onClick={() => onSelect({ section: "projects", entryId: item.id })}>
              {editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-entry-delete cv-editor-controls" aria-label={`Delete ${item.name || "project"}`} onClick={(event) => { event.stopPropagation(); onDelete({ type: "project", id: item.id }); }}><Trash2 /></Button>}
              <div className="cv-entry-head"><h3>{field(item.name, "Project", "Project name", { section: "projects", entryId: item.id, field: "name" }, (value) => ({ type: "project", id: item.id, field: "name", value }), { editKey: `projects.${item.id}.name` }) || "Project"}<span> · </span>{field(item.role, "Role", "Project role", { section: "projects", entryId: item.id, field: "role" }, (value) => ({ type: "project", id: item.id, field: "role", value }))}</h3><p className="cv-date">{field(item.date, "Date", "Project date", { section: "projects", entryId: item.id, field: "date" }, (value) => ({ type: "project", id: item.id, field: "date", value }))}</p></div>
              {visible(Boolean(item.description)) && <p>{field(item.description, "Describe the project and outcome…", "Project description", { section: "projects", entryId: item.id, field: "description" }, (value) => ({ type: "project", id: item.id, field: "description", value }), { multiline: true })}</p>}
              {visible(Boolean(item.url)) && <p className="cv-url">{field(item.url, "Project URL", "Project URL", { section: "projects", entryId: item.id, field: "url" }, (value) => ({ type: "project", id: item.id, field: "url", value }))}</p>}
            </div>
          ))}
        </Section>
      )}

      {visible(data.skills.length > 0) && (
        <Section id="skills" title="Skills" editable={editable} empty={!data.skills.length} onSelect={() => onSelect({ section: "skills" })} onAdd={() => onAdd({ type: "skill" })}>
          <p className="cv-skills">{data.skills.map((skill, index) => <span className="cv-skill" data-empty={!skill || undefined} key={`${index}-${skill}`}>{skill && data.skills.slice(0, index).some(Boolean) && <span className="cv-skill-separator"> · </span>}{field(skill, "Skill", "Skill", { section: "skills", field: "skills", index }, (value) => ({ type: "skill", index, value }), { editKey: `skills.${index}` })}{editable && <Button type="button" variant="ghost" size="icon-xs" className="cv-skill-delete cv-editor-controls" aria-label={`Delete ${skill || "skill"}`} onClick={(event) => { event.stopPropagation(); onDelete({ type: "skill", index }); }}><Trash2 /></Button>}</span>)}</p>
        </Section>
      )}
    </article>
  );
}
