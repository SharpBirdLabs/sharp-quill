<p align="center">
  <img src="public/logo.png" alt="SharpQuill" width="120" height="120" />
</p>

<h1 align="center">[SharpQuill](https://sharpquill.amirtahan.ir/)</h1>

<p align="center">
  A SharpBird Labs notepad for Markdown.<br />
  Write in a true WYSIWYG view — then copy or export as Markdown whenever you need it.
</p>

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## What you get

- Visual (WYSIWYG) editing powered by [TipTap](https://tiptap.dev/)
- Horizontal toolbar with clickable buttons, icons, hover tooltips, and active states
- Headings, bold / italic / underline / strikethrough, lists, links, inline code, code blocks, blockquotes, horizontal rules, undo / redo
- Visual ↔ raw Markdown toggle with live conversion
- Copy as Markdown and export as HTML
- Light and dark themes
- Character and word counts
- Auto-save to `localStorage`
- Clear document
- Focus mode (hides the chrome; press `Esc` to exit)

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Bold | `Ctrl/⌘ + B` |
| Italic | `Ctrl/⌘ + I` |
| Underline | `Ctrl/⌘ + U` |
| Strikethrough | `Ctrl/⌘ + Shift + S` |
| Heading 1 / 2 / 3 | `Ctrl/⌘ + 1 / 2 / 3` (or `Ctrl/⌘ + Alt + 1 / 2 / 3`) |
| Link | `Ctrl/⌘ + K` |
| Inline code | `Ctrl/⌘ + E` |
| Code block | `Ctrl/⌘ + Alt + C` |
| Blockquote | `Ctrl/⌘ + Shift + B` |
| Ordered list | `Ctrl/⌘ + Shift + 7` |
| Unordered list | `Ctrl/⌘ + Shift + 8` |
| Horizontal rule | `Ctrl/⌘ + Shift + H` |
| Undo / Redo | `Ctrl/⌘ + Z` / `Ctrl/⌘ + Shift + Z` |
| Exit focus mode | `Esc` |

Some browsers reserve `Ctrl+1`–`Ctrl+3` for tab switching. Use the heading buttons, or `Ctrl/⌘ + Alt + 1 / 2 / 3`, if that happens.

## Project layout

```
src/
  App.tsx                 # Editor wiring, auto-save, export, dialogs
  components/             # Toolbar, header, status bar, dialogs
  extensions/keymap.ts    # Extra keyboard shortcuts
  hooks/useTheme.ts       # Light / dark mode
  lib/markdown.ts         # HTML ↔ Markdown conversion
  lib/storage.ts          # localStorage helpers
```

## Stack

React 19, Vite, Tailwind CSS v4, TipTap, Lucide icons, `marked`, and `turndown`.

---

Made by [SharpBird Labs](https://www.amirtahan.ir/sharpbird).
