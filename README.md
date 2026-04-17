# WriteFlow – Product & Technical Specification (v3)

## 1. Vision

Build **developer infrastructure for AI-powered content editing** — a drop-in editor component that any app can embed to give its users:

> Write → Improve → Optimize → Publish

This is not an end-user writing app. This is the **infrastructure layer** that developers integrate into their products. The end user never knows WriteFlow exists — they just know their app's editor is smart.

### Category

**Developer infrastructure for content editing** — in the same category as Tiptap, Slate, and Quill, but differentiated by being AI-first, SEO-aware, and performance-optimized out of the box.

### Core Principles

* Infrastructure-first — we are a component, not a product the end user sees
* AI-first writing experience baked into the editing layer
* Progressive enhancement (features appear when needed)
* Zero friction by default — `<Editor />` works with no config
* **TypeScript-first, non-negotiable** — type safety is a product requirement, not optional polish. No `any` in the public API surface. Internal `any` usage is strictly controlled (reviewed, documented, never leaked to consumers).

---

## 2. Core Product Identity

### Primary Value Proposition

> "The best AI-powered writing infrastructure for developers — drop it into any app."

**The product succeeds or fails based on the quality of the inline AI rewrite experience.** Everything else — SEO, storage, restructuring, theming — is supporting. If the rewrite UX is not excellent, nothing else matters.

### What it is

* **Developer infrastructure** — a drop-in editor component with best-in-class inline AI rewriting
* The upgrade path from Tiptap/Slate/Quill for teams that want AI, SEO, and image optimization without building it themselves
* A low-friction integration: `npm install` → `<Editor ai={{...}} />` → done

### What it is NOT

* Not an end-user product (no standalone app, no SaaS dashboard)
* Not competing with Notion, Grammarly, or Jasper (those are closed end-user tools)
* Not a full SEO platform
* Not a CMS
* Not a complex content suite

### Non-Goals (v0.1)

These are explicitly out of scope for v0.1. They are not "later features" — they are boundaries that prevent drift.

* **Building a standalone writing app** — we are infrastructure, not a product end users download
* **Competing with end-user tools** (Notion, Grammarly, Jasper) — different category, different buyer, different distribution
* **Building a full SEO suite comparable to dedicated tools** — we provide progressive SEO signals, not a Clearscope/SurferSEO competitor
* **Supporting multiple frontend frameworks** — React + Next.js only; Vue, Svelte, Vanilla JS are future
* **Providing a full CMS or publishing platform** — we are an editor component, not a content management system
* **Solving all content workflows** — focus is writing + improvement only, not collaboration, versioning, or approval flows
* **Competing on AI model quality** — we are a UX layer on top of BYO AI providers, not an AI model company
* **Building a plugin/extension marketplace** — internal modularity only; no third-party plugin system yet

---

## 3. Core Experience (User Flow)

The editor experience is organized into three phases. Each phase activates progressively — the user is never overwhelmed, and intelligence scales with intent.

### Phase 1 — Writing (Primary Mode)

The default state. Everything serves fluid, distraction-free writing.

#### Core Interactions

* Rich text editing (Tiptap)
* Select text → AI rewrite (inline)
* Diff preview (before/after)
* Accept / reject changes

#### Light SEO Signals (Passive, During Writing)

Subtle, non-blocking structural hints appear while writing. These are **not** a full SEO mode — they are quiet guardrails that prevent the user from building up problems that are painful to fix later.

| Signal | Behavior | Visual Treatment |
|---|---|---|
| Missing H1 | Tiny indicator appears if no H1 exists after first paragraph | Small icon in gutter or top bar |
| Weak title | Faint underline on title if too short, too long, or generic | Subtle dashed underline, muted color |
| Heading hierarchy break | Warning if H3 follows H1 (skipping H2) | Faint color shift on the heading |
| Empty alt text | Indicator on images without alt text | Small badge on image block |

#### Design Rules for Light Signals

* **Structural only** — heading hierarchy, title quality, image alt text
* **Never content-level** — no keyword density, readability scores, or optimization suggestions during writing
* **Always ignorable** — no modals, no popups, no blocking UI
* **Visually quiet** — muted colors, small indicators, disappear when resolved
* **Zero performance cost** — computed from document structure, no AI calls

#### UX Goal

* Zero distraction for the writer
* Gentle awareness of structural issues as they form
* No "surprise correction" when reaching publish

---

### Phase 2 — Optimization (Triggered Before Publish)

Full SEO and content analysis activates **only when the user signals intent to publish**. By this point, most structural issues are already resolved thanks to Phase 1's light signals.

#### Activation Trigger

* User clicks "Publish" or "Review" button
* Explicit action — never automatic

#### Features

| Feature | Description |
|---|---|
| Heading structure validation | Full hierarchy check with specific fix suggestions |
| Readability scoring | Sentence length, paragraph density, reading level |
| Keyword analysis | Density check, distribution across sections |
| Title & meta suggestions | AI-powered title alternatives, meta description draft |
| Internal linking suggestions | Recommend links to related content (if configured) |
| Over-optimization warnings | Flag keyword stuffing or unnatural patterns |

#### UX Principles

* Presented as a lightweight panel (not a dashboard)
* All suggestions are **non-blocking** — user can publish without fixing anything
* Each suggestion is actionable with one click (apply / dismiss)
* Panel closes cleanly, no lingering state

#### What Changes from Phase 1 to Phase 2

| Aspect | Phase 1 (Writing) | Phase 2 (Pre-Publish) |
|---|---|---|
| Scope | Structural hints only | Full content + structural analysis |
| Keyword analysis | Never shown | Active |
| Readability score | Never shown | Active |
| Visual weight | Whisper-quiet indicators | Visible panel with clear actions |
| AI involvement | None (pure document parsing) | AI-powered suggestions |
| User intent | Writing, not optimizing | Ready to review and ship |

---

### Phase 3 — Output (Automatic)

When the user publishes, the system silently handles performance optimization. No configuration required.

#### Automatic Processing

* Image compression and format conversion (WebP/AVIF)
* Responsive image size generation
* Clean HTML/Markdown/JSON output
* Lazy loading attributes on images

#### UX

* Invisible — user sees "Published" and the system handles the rest
* No manual settings for v0.1
* Advanced users can override defaults in future versions

---

## 4. Feature Breakdown

### 4.1 AI Rewrite (Core Feature)

The defining experience of the product. This must be best-in-class.

#### Capabilities

* Rewrite selected text with full context awareness
* Maintain surrounding tone and style
* Handle partial selections (sentence fragments, multi-paragraph)

#### Options (Expandable UI)

* **Tone**: formal, casual, persuasive
* **Intent**: simplify, expand, clarify
* **Toggle**: preserve meaning

#### UX Details

* Floating toolbar appears on text selection
* Rewrite options collapse behind a single "Rewrite" button (expand for tone/intent)
* Diff preview shows inline before/after with highlighted changes
* Accept applies changes; Reject restores original
* Keyboard shortcuts for power users (accept: Enter, reject: Esc)
* **Performance target: < 2s perceived latency** — achieved via streaming (show tokens as they arrive) or optimistic UI; actual provider response time is outside our control, but the user should *feel* instant

---

### 4.2 AI Restructuring

Full article structure improvement with a **full restructuring UI** in v0.1.

#### Capabilities

* Improve full article structure
* Suggest headings
* Reorganize content
* Detect missing sections
* Transform draft → publish-ready

#### v0.1 Status

* Full UI for restructuring (section reorder, heading suggestions, apply / dismiss)
* Complements inline rewrite — restructuring is for document-level changes

---

### 4.3 SEO (Progressive)

SEO is not a feature — it's a **behavior** that adapts to the user's current phase.

#### During Writing (Phase 1)

* Light structural signals only (see Phase 1 section above)
* No AI calls, no content analysis
* Computed from document structure in real-time

#### Before Publish (Phase 2)

* Full analysis panel with actionable suggestions
* AI-powered title/meta recommendations
* Keyword and readability analysis
* Non-blocking — publish always available

#### Advanced SEO Engine (v0.1)

* **Keyword tracking** — target keywords, density over time, distribution across sections
* **SERP preview** — title + description + URL preview as it may appear in search results
* Integrated into the pre-publish panel (still lightweight, not a separate SEO suite)

#### Design Rule

* No heavy SEO dashboard ever
* Inline or lightweight panel only
* SEO should feel like a helpful review, not a grade

---

### 4.4 Image Optimization (Invisible)

#### Automatic Processing

* Compression before upload
* Resize to appropriate dimensions
* Format conversion (WebP/AVIF)
* Responsive size generation
* Lazy loading attributes

#### AI-Assisted (Phase 1 Integration)

* Alt text suggestion when image is inserted (light signal if empty)

#### UX

* No manual configuration required
* Processing happens on upload, results are immediate
* Advanced settings available in future versions

---

### 4.5 Storage (BYOS)

#### Supported Providers (v0.1)

* S3-compatible storage (AWS S3, Cloudflare R2)

> Note: Cloudflare R2 is S3-API-compatible, so one adapter covers both AWS S3 and R2 out of the box.

* Dedicated Google Cloud Storage adapter
* Dedicated Azure Blob Storage adapter

#### Future Providers

* Community-contributed adapters

#### Architecture

* Unified adapter interface (`put`, `get`, `delete`, `list`, `presignedUrl`)
* Pluggable — swap providers by changing one config
* Storage is modular internally, configured once by the developer, invisible to end users

#### Recommended Path (Client-Safe)

* Frontend uses **presigned URLs** — the editor calls a backend endpoint before each upload
* Backend handles all credentials — nothing sensitive in the browser
* This is the documented default and all examples use this pattern

#### Direct Credentials (Advanced / Server-Side Only)

* For server-side usage (API routes, server actions, SSR) only
* Explicitly marked as **unsafe for client-side** in types, docs, and JSDoc warnings
* Never shown in client-side examples

#### Behavior

* Configured once during setup
* Invisible to the end user afterward
* All uploads route through the adapter automatically

---

### 4.6 Bring Your Own AI (BYO AI)

#### Features

* User-provided API keys
* Multi-provider support (OpenAI, Anthropic, etc.)
* Configurable model selection

#### Architecture

* AI provider abstraction layer
* Swap providers without changing editor code
* Optional AI proxy backend for key security

---

### 4.7 Theming (System-Level)

#### Modes

* **Auto** (default) — inherit host app styles via CSS variable detection
* **Config** — accept theme object (primary, secondary, accent, background, text, border, status colors)
* **Presets** — ready-to-use themes for quick setup

#### Dark Mode

* Light / dark / system preference support

#### Implementation

* CSS variables throughout — no hardcoded colors
* Auto-detects host CSS variables
* Infers light/dark mode
* Provides sensible fallback defaults

---

### 4.8 Internationalization (i18n)

#### v0.1 Scope

* Translatable UI strings
* Locale-aware formatting

#### Behavior

* Automatic where possible
* No user friction

#### Future

* Language-aware AI prompts
* RTL support
* Multilingual content workflows

---

## 5. UX Philosophy

### Principle

> Simple first, deep when needed

### Execution

* Core actions always visible (write, rewrite)
* Advanced options hidden behind progressive disclosure
* Features appear based on context and user phase, not all at once
* Light signals guide without interrupting
* Full analysis surfaces only when the user is ready

### Goal

* Beginner-friendly — works beautifully with zero configuration
* Power-user capable — every default is overridable

---

## 6. Architecture

### Guiding Principles

> One package externally, modular architecture internally.
> **Type safety is non-negotiable** — strict mode, zero `any` in public API, strictly controlled internal usage. We do not simplify the developer experience by weakening types.

The user installs `@writeflow/editor` and gets a complete, type-safe experience. Under the hood, the codebase is cleanly separated into independent modules that can be developed, tested, and eventually extracted independently.

### TypeScript Foundation

* **Non-negotiable** — type safety is a hard requirement for consumer-facing APIs; it is not traded away for convenience
* **Strict mode enabled** — `strict: true` in `tsconfig.json`
* **No `any` in public API** — every exported type, config, callback, and event is explicitly typed
* **Internal `any` strictly controlled** — allowed only for third-party SDK interop or genuinely untyped boundaries; must be reviewed, documented with a comment explaining why, and never leaked to consumers
* **Generics where appropriate** — storage adapters, AI providers, and event callbacks are generic
* **Exported types** — every config interface, event type, and callback signature is exported for consumer use
* **IDE-first DX** — full autocomplete, inline documentation via JSDoc, and compile-time error detection
* **Simple usage stays typed** — optional props, sensible defaults, and type inference so minimal configs remain fully checked without ceremony; complexity is in *optional* advanced APIs, not in bypassing the type system

### Editor Core

* Built on Tiptap (ProseMirror-based)
* Extension-based system
* Open-source core (MIT license)
* Written entirely in TypeScript

### Internal Module Structure

```
src/
├── core/          # Tiptap setup, extensions, block structure
├── ai/            # Rewrite engine, provider abstraction, context management
├── seo/           # Light signals engine, pre-publish analysis, scoring
├── storage/       # Unified adapter interface, S3-compatible implementation
├── image/         # Compression, format conversion, responsive generation
├── theme/         # CSS variable system, auto-detection, presets
├── i18n/          # Translatable strings, locale formatting
├── react/         # React component, hooks, config-based API
└── types/         # Shared type definitions, exported public types
```

Each directory is a self-contained module with clear boundaries. Modules communicate through defined TypeScript interfaces, not direct imports across boundaries.

#### Key Rules

* **Modular internally** — clean separation of concerns, each module is independently developable and testable
* **One package externally** — users install one thing and it works; internal modularity is invisible to them
* **Interface-driven** — modules depend on typed abstractions (e.g. `StorageAdapter`, `AIProvider`), not concrete implementations
* **Extractable later** — any module can become its own package when there's a real reason to split
* **Type-safe boundaries** — every module exposes a typed public API; consumers get full autocomplete and compile-time checks

### Backend (Minimal Required)

#### Responsibilities

* AI proxy (optional but recommended for key security)
* Presigned upload URLs for storage
* Server-side image processing (heavy transforms)

#### Suggested Approach

* Serverless functions (AWS Lambda, Vercel Functions, Cloudflare Workers)
* Edge-ready architecture for future optimization

---

## 7. Framework Support

### v0.1 — First-Class (Official Docs + Examples)

* **React** — full component API, hooks, typed props
* **Next.js** — App Router and Pages Router support, Server Component compatible, RSC-safe imports

Both frameworks have official documentation, typed examples, and tested integration guides.

### Future

* Vue / Nuxt
* Svelte / SvelteKit
* Vanilla JS

---

## 8. Styling Strategy

### Core

* Headless (unstyled by default)

### UI Layer

* Optional UI component package

### Tailwind

* First-class Tailwind support
* Utility-class friendly components

### Fallback

* Default CSS theme for non-Tailwind users

---

## 9. Packaging & Installation

### v0.1 — One Package, Fully Typed

For v0.1, the editor ships as a **single package**. One install, one import, full type safety.

```bash
npm install @writeflow/editor
```

Types are included — no separate `@types/` package needed.

---

### Type-Safe API Surface

**Non-negotiable:** the public API surface has zero `any`. There is no supported path where consumers lose compile-time guarantees. Internal `any` for SDK interop is allowed but strictly controlled and never exposed.

Every config object, callback, and event is typed. Developers get autocomplete, inline docs, and compile-time validation out of the box. Ergonomics come from optional fields, defaults, and inference — not from untyped or loosely typed APIs.

#### Core Types

```typescript
import type {
  EditorConfig,
  AIConfig,
  StorageConfig,
  ThemeConfig,
  SEOConfig,
  EditorContent,
  RewriteResult,
  SEOAnalysis,
} from "@writeflow/editor";
```

#### Editor Config

```typescript
interface EditorConfig {
  ai?: AIConfig;
  storage?: StorageConfig;
  theme?: ThemeConfig;
  seo?: SEOConfig;
  locale?: string;
  content?: EditorContent;
  onChange?: (content: EditorContent) => void;
  onPublish?: (content: EditorContent, analysis: SEOAnalysis) => void;
}
```

#### AI Config

```typescript
type AIProvider = "openai" | "anthropic";
type AITone = "formal" | "casual" | "persuasive";
type AIIntent = "simplify" | "expand" | "clarify";

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
  defaultTone?: AITone;
  defaultIntent?: AIIntent;
  preserveMeaning?: boolean;
  onRewrite?: (result: RewriteResult) => void;
}

interface RewriteResult {
  original: string;
  rewritten: string;
  tone: AITone;
  intent: AIIntent;
  accepted: boolean;
}
```

#### Storage Config

Two paths are supported: **presigned URLs** (recommended, safe for client-side) and **direct credentials** (server-side only).

```typescript
type StorageProvider = "s3" | "gcs" | "azure";

interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  endpoint?: string;
  basePath?: string;

  /**
   * RECOMMENDED (client-safe): Backend endpoint that returns presigned upload URLs.
   * The editor calls this endpoint before each upload. No credentials in the browser.
   */
  presignedUrlEndpoint?: string;

  /**
   * ADVANCED / SERVER-SIDE ONLY: Direct credentials.
   * ⚠️ WARNING: Never use in client-side code — these will be exposed in the browser bundle.
   * Only use in server-side contexts (API routes, server actions, SSR).
   */
  accessKeyId?: string;
  secretAccessKey?: string;

  /** GCS-specific */
  projectId?: string;
  /** Azure-specific */
  accountName?: string;

  onUpload?: (file: UploadedFile) => void;
}

interface UploadedFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}
```

#### Theme Config

```typescript
type ThemeMode = "light" | "dark" | "auto";

interface ThemeConfig {
  mode?: ThemeMode;
  preset?: "default" | "minimal" | "editorial";
  colors?: Partial<ThemeColors>;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  border: string;
  muted: string;
  error: string;
  warning: string;
  success: string;
}
```

#### SEO Config

```typescript
interface SEOConfig {
  lightSignals?: boolean;
  prePublishPanel?: boolean;
  targetKeywords?: string[];
  locale?: string;
  onAnalysis?: (analysis: SEOAnalysis) => void;
}

interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
}

interface SEOIssue {
  type: "error" | "warning" | "info";
  code: string;
  message: string;
  element?: string;
}

interface SEOSuggestion {
  type: "title" | "meta" | "heading" | "keyword" | "readability" | "link";
  message: string;
  action?: string;
  apply?: () => void;
}
```

#### Editor Content

```typescript
interface EditorContent {
  html: string;
  markdown: string;
  json: Record<string, unknown>;
  text: string;
  wordCount: number;
  readingTime: number;
}
```

---

### React Usage

```tsx
import { Editor } from "@writeflow/editor";
import type { EditorConfig, EditorContent } from "@writeflow/editor";

const config: EditorConfig = {
  ai: {
    provider: "openai",
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
    defaultTone: "casual",
  },
  storage: {
    provider: "s3",
    bucket: "my-uploads",
    region: "us-east-1",
  },
  theme: { mode: "auto" },
  seo: { lightSignals: true, prePublishPanel: true },
};

function WritingPage() {
  const handleChange = (content: EditorContent) => {
    console.log(content.wordCount, content.readingTime);
  };

  const handlePublish = (content: EditorContent, analysis: SEOAnalysis) => {
    if (analysis.issues.filter((i) => i.type === "error").length === 0) {
      saveToDatabase(content.html);
    }
  };

  return (
    <Editor
      {...config}
      onChange={handleChange}
      onPublish={handlePublish}
    />
  );
}
```

---

### Next.js App Router Usage

```tsx
// app/write/page.tsx
import { Editor } from "@writeflow/editor";
import type { EditorConfig } from "@writeflow/editor";
import { getStorageConfig } from "@/lib/storage";

export default function WritePage() {
  const storageConfig = getStorageConfig();

  return (
    <main>
      <Editor
        ai={{
          provider: "openai",
          apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
        }}
        storage={storageConfig}
        theme={{ mode: "auto" }}
        seo={{ lightSignals: true, prePublishPanel: true }}
        onPublish={async (content) => {
          "use server";
          await saveArticle(content);
        }}
      />
    </main>
  );
}
```

---

### Next.js Pages Router Usage

```tsx
// pages/write.tsx
import { Editor } from "@writeflow/editor";
import type { EditorContent } from "@writeflow/editor";

export default function WritePage() {
  const handlePublish = async (content: EditorContent) => {
    await fetch("/api/articles", {
      method: "POST",
      body: JSON.stringify({ html: content.html }),
    });
  };

  return (
    <Editor
      ai={{ provider: "openai", apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! }}
      storage={{ provider: "s3", bucket: "blog-assets", region: "us-east-1" }}
      theme={{ mode: "dark" }}
      onPublish={handlePublish}
    />
  );
}
```

---

### Hooks API (Advanced)

For developers who need granular control beyond the `<Editor>` component:

```typescript
import {
  useEditor,
  useAIRewrite,
  useSEOAnalysis,
  useStorage,
} from "@writeflow/editor";

function CustomEditor() {
  const editor = useEditor({ theme: { mode: "dark" } });
  const { rewrite, isLoading } = useAIRewrite(editor, {
    provider: "openai",
    apiKey: "...",
  });
  const { analysis, runAnalysis } = useSEOAnalysis(editor);
  const { upload } = useStorage({ provider: "s3", bucket: "...", region: "..." });

  // Full control over layout, triggers, and behavior
}
```

All hooks are fully typed — return types, parameters, and generics provide complete autocomplete.

---

### Why One Package

* One clear install, one clear story
* Less confusion for adopters
* Easier to document, easier to support
* Matches v0.1 product identity: one integrated editor experience
* Types ship with the package — no extra installs

### When to Split (Future)

Only break into multiple packages when one of these becomes true:

* Non-React frameworks are added (Vue, Svelte wrappers)
* Users need headless-only usage (no UI)
* Storage/AI adapters become reusable outside the editor
* Bundle size becomes a real problem
* Enterprise users need partial installs

Then the evolution looks like:

```
@writeflow/editor          → full experience (React + Next.js)
@writeflow/core            → headless editor engine
@writeflow/react           → React bindings
@writeflow/adapter-s3      → standalone storage adapter
@writeflow/adapter-gcs     → standalone storage adapter
```

But not yet. Split when there's a real reason, not in advance.

### Future CLI

```bash
npx create-writeflow-app
```

#### CLI Capabilities

* Scaffold project (React or Next.js)
* Configure AI provider
* Setup storage adapter
* Enable Tailwind
* Choose theme preset
* TypeScript config included by default

---

## 10. Export & Integration

### Output Formats

* HTML (clean, semantic)
* Markdown
* JSON (structured)

### Future Integrations

* Headless CMS systems
* Static site generators
* Git-based content workflows

---

## 11. MVP Scope (v0.1)

### Ships As

```bash
npm install @writeflow/editor
```

One package. Fully typed. All MVP features included. Official docs for React + Next.js.

### Core v0.1 (ship first — non-negotiable)

These define the product. Nothing else ships until these are excellent.

* Tiptap editor with clean default UI
* Inline AI rewrite with diff preview (accept/reject) — **this is the product; it must be best-in-class**
* Light SEO signals during writing (structural hints)
* Pre-publish SEO panel (basic analysis)
* Automatic image optimization on upload
* S3-compatible storage adapter (covers AWS S3 + Cloudflare R2)
* Typed `<Editor>` component + hooks API
* Official React examples with full type coverage
* Official Next.js examples (App Router + Pages Router)
* Dark/light mode + basic theming
* BYO AI key support (OpenAI as first provider)
* Exported TypeScript types for all configs, events, and callbacks
* Zero `any` in public API surface (internal `any` strictly controlled)

### v0.1+ (if time permits — do not sacrifice core quality for these)

Each of these is a product-level feature requiring its own UX decisions, iteration, and validation. They ship only after core v0.1 is solid.

* Full article restructuring UI
* Advanced SEO engine (keyword tracking, SERP preview)
* Dedicated GCS / Azure storage adapters

### Not in Focus

* Vue / Svelte support
* CLI tooling
* Package splitting

---

## 12. Monetization Direction (Early)

### Model

Open-core

### Free

* Full editor package (`@writeflow/editor`)
* Basic AI features (user provides their own API key)
* S3-compatible storage
* Theming + dark mode

### Paid (future)

* Hosted AI proxy backend (managed infrastructure for teams that don't want to run their own)
* Advanced AI workflows (restructuring, batch operations)
* Premium themes and UI components
* Analytics and content insights
* Priority support + SLA for production apps

---

## 13. Differentiation

### vs. Existing Editor Infrastructure (Tiptap, Slate, Quill)

* **AI-first** — inline rewriting is built in, not a DIY integration
* **SEO-aware** — progressive signals and pre-publish analysis included
* **Performance-optimized** — automatic image optimization and clean output
* **Batteries included** — storage adapters, theming, i18n out of the box
* **One install** — no need to assemble 10 packages; `<Editor />` works immediately

### vs. End-User Writing Tools (Notion, Grammarly, Jasper)

* **Different market entirely** — we sell to developers, they sell to writers
* **Embeddable** — our product lives inside other products
* **BYO everything** — users bring their own AI provider and storage
* **Open-core** — no vendor lock-in

### Core Strength

* Best inline AI rewriting UX in an embeddable editor component — fast, contextual, zero-friction

### Supporting Advantages

* Progressive SEO — light signals during writing, full analysis before publish
* Performance-first output — automatic optimization, no configuration
* True infrastructure — drop-in, headless, fully customizable, invisible to end users
* Zero lock-in — BYO storage, BYO AI, open-core
* **Non-negotiable type safety** — zero `any` in public API; internal usage strictly controlled

---

## 14. Competitive Landscape

### Our Category

Developer infrastructure for content editing — **not** end-user writing tools.

### Actual Competitors (same category)

| Product | What it is | Where WriteFlow differs |
|---|---|---|
| Tiptap | Headless editor framework (ProseMirror) | No built-in AI, no SEO, no image optimization — you build everything yourself |
| Slate | Low-level editor framework (React) | Maximum flexibility, minimum batteries — steep integration cost |
| Quill | Opinionated rich text editor | Aging architecture, no AI, limited extensibility |
| Editor.js | Block-based editor | No AI, limited ecosystem, no TypeScript-first DX |

WriteFlow is what you get **after** Tiptap — the same ProseMirror foundation, but with AI rewriting, progressive SEO, image optimization, and storage adapters already built in.

### NOT Our Competitors (different category entirely)

| Product | Why it's not a competitor |
|---|---|
| Notion | End-user product, closed ecosystem, not embeddable as infrastructure |
| Grammarly | Browser extension / SaaS for end users, not developer infrastructure |
| Jasper | AI content generation SaaS for marketers, not an embeddable component |
| Google Docs | End-user product, not a developer tool |

These serve end users directly. We serve **developers who build apps that serve end users**. Different buyer, different distribution, different market.

### Strategic Implication

* Less direct competition — we're not fighting huge incumbents
* Easier adoption — `npm install` is lower friction than any SaaS onboarding
* Distribution through developer channels (npm, GitHub, dev communities, side projects)
* This is how Tiptap, Stripe, and Vercel grew — infrastructure adopted by builders

---

## 15. Target Users

### Buyer (who decides to adopt WriteFlow)

* **Developers** building apps that need content editing (blogs, docs, CMS, internal tools)
* **Product teams** at startups choosing their editor stack
* **Indie hackers** shipping content-driven products fast

### End User (who interacts with the editor — but never knows WriteFlow exists)

* Writers, marketers, content teams using the host app
* They experience the AI rewrite, SEO signals, and image optimization — but as features of *their* app, not ours

### Distribution Audience (who spreads awareness)

* Developers on GitHub, npm, dev Twitter/X, Hacker News
* Side project builders who adopt it and talk about it
* Technical bloggers reviewing editor infrastructure

---

## 16. Distribution Strategy

WriteFlow is **developer infrastructure**. It spreads through developer channels, not marketing funnels.

### Primary Channels

* **npm** — the install command is the distribution. `npm install @writeflow/editor` is how every adoption starts
* **GitHub** — open-source repo, stars, issues, PRs build trust and visibility
* **Developer communities** — dev Twitter/X, Hacker News, Reddit (r/reactjs, r/webdev), Discord servers
* **Side projects** — indie hackers adopt it for their blogs, docs, changelogs; each integration is a reference

### Growth Model

1. Developer discovers WriteFlow (GitHub, npm, blog post, word of mouth)
2. Tries it in a side project — `npm install`, `<Editor />`, works in minutes
3. Adopts it in production app
4. Team sees it, adopts for next project
5. Developer mentions it to other developers

This is the Tiptap / Stripe / Tailwind growth model: **infrastructure adopted by builders, spread through usage**.

### What We Don't Do (v0.1)

* No paid ads
* No sales team
* No enterprise outreach
* Growth comes from product quality and developer word of mouth

---

## 17. Risks

* Weak rewrite UX execution (this is the entire product — must be excellent)
* Complexity leaking into the integration API
* "Light signals" becoming noisy if not carefully tuned
* Over-building beyond core experience before product-market fit
* Positioning drift — accidentally building an end-user product instead of infrastructure

---

## 18. Guiding Principles

* Focus on core experience first (AI rewrite UX)
* We are infrastructure — the developer is our user, the end user is their user
* Hide complexity behind smart defaults
* Build modular, expose gradually
* Optimize for clarity over completeness
* Never interrupt the writer — guide, don't gate
* **Type safety is non-negotiable** — zero `any` in public API, strictly controlled internally; improve DX with defaults, optional props, and docs, never by loosening types

---

## 19. Success Criteria

* Developers adopt WriteFlow as their editor component
* Weekly npm installs grow organically through developer word of mouth
* High retention — once integrated, teams keep using it
* Low integration friction — under 10 minutes from `npm install` to working editor
* Clear product identity: "the AI editor infrastructure for developers"
* Type safety holds in practice: adopters report strong IDE support and few runtime surprises from misconfiguration

---
