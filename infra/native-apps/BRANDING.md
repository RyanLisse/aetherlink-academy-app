# Academy branding overlay (AET-51)

Thin, versioned chrome — not six UI forks. Tokens live in
`infra/native-apps/tokens.css` and `packages/branding`. Apply via scoped
`.academy-chrome` / data attributes; never global selectors that restyle
slide canvas, Proof iframe, or video output.

## Hooks inventory (upstream templates)

| App | Theming hook | Notes |
|-----|--------------|-------|
| slides | `defineDesignSystem({})`, `app/global.css` CSS vars | Map Academy tokens; keep deck presentation styles |
| chat | toolkit/shadcn CSS vars + `brandName`/`brandHref`/`brandIcon` on app-shell sidebar | Coordinate with AET-56 embed chrome |
| assets / calendar / clips / content | same toolkit sidebar props when present | Fallback: inject overlay iframe chrome only |

## Required chrome

- Logo/favicon (Academy mark)
- Color + type tokens (light/dark/focus/contrast)
- Visible **Back to Academy** with `returnTo` context
- Respect EN/NL UI locale; do not silently translate lesson content
- Keyboard, focus-visible, reduced-motion

Identity/SSO is **AET-53**, not styling.
