import { Extension } from '@tiptap/core'

type NotepadKeymapOptions = {
  onLink: () => void
  onPalette: () => void
}

/** Extra shortcuts on top of TipTap defaults (Ctrl+B / Ctrl+I / undo). */
export const NotepadKeymap = Extension.create<NotepadKeymapOptions>({
  name: 'notepadKeymap',

  addOptions() {
    return {
      onLink: () => {},
      onPalette: () => {},
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-3': () => this.editor.commands.toggleHeading({ level: 3 }),
      'Mod-Alt-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-Alt-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-Alt-3': () => this.editor.commands.toggleHeading({ level: 3 }),
      'Mod-k': () => {
        this.options.onPalette()
        return true
      },
      'Mod-p': () => {
        this.options.onPalette()
        return true
      },
      'Mod-Shift-k': () => {
        this.options.onLink()
        return true
      },
      'Mod-e': () => this.editor.commands.toggleCode(),
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
      'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
      'Mod-Shift-9': () => this.editor.commands.toggleTaskList(),
      'Mod-Shift-h': () => this.editor.commands.setHorizontalRule(),
    }
  },
})
