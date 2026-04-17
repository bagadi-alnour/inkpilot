# Theme system

## Overview

Themes combine a **mode** (light, dark, or auto), an optional **preset** palette, and optional **color overrides**. Resolved colors are applied as **CSS variables** on the editor container so you can style surrounding UI to match.

## `ThemeConfig`

```typescript
import type { ThemeConfig, ThemePreset } from "@writeflow/editor";

const theme: ThemeConfig = {
  mode: "auto", // "light" | "dark" | "auto"
  preset: "default", // "default" | "minimal" | "editorial"
  colors: {
    // optional partial overrides on top of the preset
    primary: "#2563eb",
    background: "#ffffff",
  },
};
```

## Presets

| Preset       | Character |
| ------------ | --------- |
| `default`    | Balanced blue/violet accent, light and dark pairs |
| `minimal`    | Neutral grays, high contrast |
| `editorial`  | Warm paper-like light, muted dark variant |

Each preset defines full `ThemeColors` for both light and dark; `mode: "auto"` picks based on detection (below).

## CSS variables

The editor emits variables with the `--wf-` prefix (see `CSS_VARS` in the package). Common references:

| Variable | Role |
| -------- | ---- |
| `--wf-color-primary` | Primary accent |
| `--wf-color-secondary` | Secondary accent |
| `--wf-color-accent` | Highlight / links |
| `--wf-color-bg` | Surface background |
| `--wf-color-fg` | Primary text |
| `--wf-color-border` | Borders / dividers |
| `--wf-color-muted` | Muted surfaces |
| `--wf-color-muted-fg` | Secondary text |
| `--wf-color-error` | Error states |
| `--wf-color-warning` | Warnings |
| `--wf-color-success` | Success |

Additional tokens include `--wf-font-body`, `--wf-font-heading`, `--wf-font-mono`, radii (`--wf-radius-sm` …), and spacing `--wf-space-1` … `--wf-space-8`.

Use these in your own layout CSS for a consistent chrome around the editor.

## Auto-detection

When `mode` is `"auto"`, resolution follows:

1. `data-theme="dark"` or `data-theme="light"` on `document.documentElement` or `document.body`
2. `.dark` or `.light` class on the same elements
3. `prefers-color-scheme: dark` via `matchMedia`
4. Fallback: `light`

This matches common app shells (e.g. `class="dark"` on `<html>`).

## Custom theme example

```tsx
import { Editor } from "@writeflow/editor";

export function ThemedEditor() {
  return (
    <Editor
      theme={{
        mode: "dark",
        preset: "minimal",
        colors: {
          primary: "#22c55e",
          border: "#27272a",
        },
      }}
    />
  );
}
```

## `useTheme`

For custom shells, drive the same resolution logic:

```tsx
import { useRef } from "react";
import { useTheme } from "@writeflow/editor";

const containerRef = useRef<HTMLDivElement>(null);

const { theme, mode, setMode, applyPreset } = useTheme(
  { mode: "auto", preset: "editorial" },
  containerRef,
);

// theme.mode is resolved "light" | "dark"
// theme.colors, theme.preset

setMode("dark");
applyPreset("minimal");
```

Passing `containerRef` applies variables to that element via the package’s `applyTheme` helper.

## Notes

- The root `<Editor />` wrapper sets `data-wf-theme` to the resolved mode for styling hooks.
- Host apps can expose their own CSS variables; `detectHostCSSVariables` (internal theme helpers) can read common third-party tokens when integrating with design systems.
