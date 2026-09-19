import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const searchPluginKey = new PluginKey<{ query: string; index: number }>('searchHighlight')

function buildDecorations(doc: ProseMirrorNode, query: string, activeIndex: number) {
  if (!query) return { set: DecorationSet.empty, count: 0 }

  const decorations: Decoration[] = []
  const needle = query.toLowerCase()
  let count = 0

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const haystack = node.text.toLowerCase()
    let from = 0
    while (from < haystack.length) {
      const found = haystack.indexOf(needle, from)
      if (found === -1) break
      const start = pos + found
      const end = start + query.length
      decorations.push(
        Decoration.inline(start, end, {
          class: count === activeIndex ? 'search-match-active' : 'search-match',
        }),
      )
      count += 1
      from = found + query.length
    }
  })

  return { set: DecorationSet.create(doc, decorations), count }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchQuery: (query: string) => ReturnType
      setSearchIndex: (index: number) => ReturnType
    }
  }

  interface Storage {
    searchHighlight: {
      query: string
      index: number
      count: number
    }
  }
}

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addStorage() {
    return {
      query: '',
      index: 0,
      count: 0,
    }
  },

  addCommands() {
    return {
      setSearchQuery:
        (query: string) =>
        ({ tr, dispatch, editor }) => {
          editor.storage.searchHighlight.query = query
          editor.storage.searchHighlight.index = 0
          if (dispatch) dispatch(tr.setMeta(searchPluginKey, { query, index: 0 }))
          return true
        },
      setSearchIndex:
        (index: number) =>
        ({ tr, dispatch, editor }) => {
          const count = editor.storage.searchHighlight.count as number
          const next = count > 0 ? ((index % count) + count) % count : 0
          editor.storage.searchHighlight.index = next
          if (dispatch) {
            dispatch(
              tr.setMeta(searchPluginKey, {
                query: editor.storage.searchHighlight.query,
                index: next,
              }),
            )
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init: () => ({ query: '', index: 0 }),
          apply: (tr, value) => {
            const meta = tr.getMeta(searchPluginKey) as { query: string; index: number } | undefined
            if (meta) return meta
            if (tr.docChanged) return { ...value }
            return value
          },
        },
        props: {
          decorations(state) {
            const value = searchPluginKey.getState(state)
            const query = value?.query ?? ''
            const index = value?.index ?? 0
            const { set, count } = buildDecorations(state.doc, query, index)
            extension.storage.count = count
            return set
          },
        },
      }),
    ]
  },
})
