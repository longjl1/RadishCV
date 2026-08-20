# RadishCV

A local-first resume/CV builder with optional Kimi or DeepSeek editing. It accepts plain-text drafts or structured form input, renders three print-ready layouts, and exports PDF, text, or a restorable JSON backup.

## Product scope

- Upload `.txt`, `.md`, or RadishCV `.json` files (up to 250 KB).
- Fill structured Profile, Experience, Education, Publications, Projects, and Skills sections.
- Edit every visible CV field directly on the A4 canvas, with the right-hand form kept in sync.
- Add and remove entries and bullets from the document itself; complete-entry deletion requires confirmation.
- Rename, remove, and restore standard CV sections, or add free-text custom sections from the sidebar.
- Parse a text draft into structured fields with Kimi or DeepSeek.
- Improve wording against an optional job description with an explicit no-fabrication system prompt.
- Choose MIT Classic, Harvard Academic, or Yale Modern layouts.
- Export a selectable-text PDF through the browser print dialog, an ATS-friendly `.txt`, or a restorable `.json`.
- Autosave the working draft in the current browser's `localStorage`.

The university-inspired templates are independently recreated layouts. They do not copy university branding and are not endorsed by the named institutions.

## Run locally

Requirements: Node.js 20.9+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

If `pnpm` is not installed but Node includes Corepack:

```bash
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The app works without an API key for manual editing, preview, local save, and export.

To enable AI, set at least one server-side key in `.env.local`:

```dotenv
DEEPSEEK_API_KEY=your_key
# or
MOONSHOT_API_KEY=your_key
```

The base URLs and model names are overridable. Defaults are documented in `.env.example`.

## Deploy to Vercel

1. Import this `resume-helper` directory as a Vercel project.
2. Keep the framework preset as Next.js.
3. Add `DEEPSEEK_API_KEY` and/or `MOONSHOT_API_KEY` under Project Settings → Environment Variables.
4. Deploy.

Next.js/Vercel is used instead of a static GitHub Pages build because the provider API key must remain server-side. A GitHub Pages-only version would either expose the key or require users to enter their own key in every browser.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Source templates and guidance

The app links to these first-party resources from each template card:

- [MIT CAPD composite resume samples (PDF)](https://cdn.uconnectlabs.com/wp-content/uploads/sites/123/2025/05/Composite-resume-samples-1.pdf)
- [Harvard GSAS CV and cover letter guide (PDF)](https://hwpi.harvard.edu/files/ocs/files/gsas-cvs-and-cover-letters.pdf)
- [Yale OCS resume templates](https://ocs.yale.edu/resources/ocs-resume-template/)

Additional useful official samples:

- [Harvard College guide to creating a strong resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/)
- [MIT CAPD sample resume library](https://capd.mit.edu/resources/sample-resumes/)
- [Columbia resume example (PDF)](https://www.careereducation.columbia.edu/sites/default/files/2025-01/resume-sample-with-pop-outs.pdf)

## Privacy and safety boundaries

- Drafts remain in browser storage by default.
- Only explicit AI actions send resume text to the selected provider.
- Provider keys are read only by the server route and are never returned to the browser.
- The server caps source and job-description lengths and sanitizes the model's JSON response.
- AI output still needs human review. The app cannot verify whether a claim is true or guarantee ATS compatibility with every employer system.
