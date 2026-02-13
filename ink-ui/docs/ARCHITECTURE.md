# Architecture

## Overview

ink-ui is a monochrome design system built on three layers:

```
┌─────────────────────────────────────────────┐
│  React Components (src/components/*.tsx)     │  ← forwardRef, typed props
├─────────────────────────────────────────────┤
│  Tailwind Preset (preset.js)                │  ← color tokens, plugin classes
├─────────────────────────────────────────────┤
│  CSS Foundation (kindle.css)                │  ← variables, base styles, classes
└─────────────────────────────────────────────┘
```

Each layer can be used independently:
- **CSS-only**: Import `kindle.css` and use `.btn-kindle`, `.input-kindle`, etc.
- **Tailwind**: Add the preset and use tokens like `bg-primary`, `text-accent`
- **React**: Import typed components that compose the CSS classes internally

## Package Exports

```
@oidanice/ink-ui       → dist/index.js (CJS) / dist/index.mjs (ESM)
@oidanice/ink-ui/preset → preset.js (Tailwind preset, CJS)
@oidanice/ink-ui/css    → kindle.css (CSS custom properties + classes)
```

## Design Decisions

### CSS Variables over Hardcoded Values

All colors flow from CSS custom properties (`--bg`, `--text`, `--border`, `--accent`, etc.). This means:
- Theme switching is instant (no React re-renders)
- Any project can override variables without touching source
- Dark mode works via `.dark` class OR `[data-theme="dark"]` attribute

### Accent System

`--accent` defaults to `--text`, making the design system monochrome by default. Projects can override `--accent` to add brand color only where it matters (focus rings, progress bars, solid badges) without breaking the monochrome base.

### forwardRef on All Components

Every component uses `forwardRef` so parent components can manage focus, scroll-into-view, or attach refs for accessibility. This is non-negotiable for a design system.

### className Override Pattern

All components accept `className` which is appended (not replaced). This allows Tailwind utility overrides:

```tsx
<Input className="max-w-sm" />  // narrows the input
<Badge className="text-lg" />   // bigger badge
```

### No border-radius, No shadows, No gradients

The Kindle/E-Reader aesthetic is intentionally flat. Decorative CSS is explicitly avoided. Visual hierarchy comes from:
- Font weight and size (serif for titles, mono for data)
- Color inversion on interaction (hover/active)
- 1px borders for structure
- Opacity for states (disabled, loading)

## File Structure

```
ink-ui/
├── kindle.css                 # CSS foundation (variables, base, classes)
├── preset.js                  # Tailwind CSS preset (tokens, plugin)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts               # Public API (all exports)
│   ├── components/
│   │   ├── Badge.tsx           # Status labels, tags
│   │   ├── Button.tsx          # Monochrome button with inversion
│   │   ├── Card.tsx            # Content container
│   │   ├── DarkModeToggle.tsx  # Sun/moon theme toggle
│   │   ├── Divider.tsx         # Horizontal rule
│   │   ├── FilterChip.tsx      # Toggle chip for filtering
│   │   ├── Input.tsx           # Text input with label
│   │   ├── InstallPrompt.tsx   # PWA install banner
│   │   ├── Layout.tsx          # Page layout with sidebar
│   │   ├── Progress.tsx        # Progress bar (determinate/indeterminate)
│   │   ├── Select.tsx          # Native select with styling
│   │   └── TextArea.tsx        # Multi-line text input
│   └── hooks/
│       └── useDarkMode.ts      # Dark mode state management
└── docs/
    ├── ARCHITECTURE.md          # This file
    └── CONTRIBUTING.md          # How to contribute
```

## Build

Built with [tsup](https://tsup.egoist.dev/):
- **CJS** (`dist/index.js`) for Node.js / CommonJS imports
- **ESM** (`dist/index.mjs`) for modern bundlers
- **Types** (`dist/index.d.ts`) for TypeScript consumers

The `preset.js` and `kindle.css` files are shipped as-is (no bundling needed).

## Component Categories

| Category | Components | Purpose |
|----------|-----------|---------|
| **Layout** | Layout, Divider | Page structure |
| **Form** | Input, Select, TextArea | Data entry |
| **Display** | Card, Badge, Progress | Content presentation |
| **Interactive** | Button, FilterChip | User actions |
| **Utility** | DarkModeToggle, InstallPrompt | App-level features |
| **Hooks** | useDarkMode | State management |
