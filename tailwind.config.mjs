/**
 * AET-120: Tailwind sits on top of the hand-written Academy stylesheet, it does not replace it.
 * - `preflight` stays off so `src/style.css` keeps owning the element defaults (buttons, inputs, borders).
 * - Colours point straight at the Academy CSS variables, so shadcn/ui and AI Elements inherit the
 *   dark/light themes already declared on `:root` / `:root[data-theme=light]`.
 */
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {preflight: false},
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--cyan)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {DEFAULT: 'var(--cyan)', foreground: 'var(--bg)'},
        secondary: {DEFAULT: 'var(--surface2)', foreground: 'var(--text)'},
        destructive: {DEFAULT: 'var(--danger)', foreground: 'var(--danger-fg)'},
        muted: {DEFAULT: 'var(--surface2)', foreground: 'var(--muted)'},
        accent: {DEFAULT: 'var(--selected)', foreground: 'var(--cyan)'},
        popover: {DEFAULT: 'var(--surface)', foreground: 'var(--text)'},
        card: {DEFAULT: 'var(--surface)', foreground: 'var(--text)'},
        success: {DEFAULT: 'var(--success)', foreground: 'var(--text)'},
        warn: {DEFAULT: 'var(--warn)', foreground: 'var(--text)'},
      },
      borderRadius: {lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)'},
    },
  },
  plugins: [animate],
};
