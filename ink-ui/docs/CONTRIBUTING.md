# Contributing

## Development Setup

```bash
git clone https://github.com/LL4nc33/ink-ui.git
cd ink-ui
npm install
npm run dev    # watch mode
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Build CJS, ESM, and type declarations |
| `npm run dev` | Build in watch mode |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clean` | Remove `dist/` directory |

## Adding a New Component

1. Create `src/components/MyComponent.tsx`
2. Use `forwardRef` and export typed props
3. Export from `src/index.ts`
4. If the component needs a CSS class, add it to both `kindle.css` and `preset.js`
5. Document in `README.md`

### Component Template

```tsx
import { HTMLAttributes, forwardRef } from 'react'

export interface MyComponentProps extends HTMLAttributes<HTMLDivElement> {
  /** Describe the prop. */
  variant?: 'default' | 'alt'
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  function MyComponent({ variant = 'default', className = '', children, ...props }, ref) {
    return (
      <div ref={ref} className={`my-class ${className}`} {...props}>
        {children}
      </div>
    )
  }
)
```

### Rules

- **forwardRef** on every component
- **className** prop appends, never replaces
- **CSS variables** for all colors -- no hardcoded hex values in components
- **No border-radius, no shadows, no gradients**
- **Mono font** for data/inputs, **serif** for titles/headings
- Export both the component and its Props type from `src/index.ts`

## CSS Class Naming

All CSS classes use the `-kindle` suffix:

```
.btn-kindle
.input-kindle
.select-kindle
.textarea-kindle
.progress-kindle
.divider-kindle
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(input): add disabled state styling
fix(layout): sidebar border on right position
docs: update README with TextArea examples
```
