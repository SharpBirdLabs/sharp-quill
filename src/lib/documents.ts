import {
  emptyDocument,
  idbClear,
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
  type QuillDocument,
} from './idb'

const LEGACY_KEY = 'sharpquill:document'
const ACTIVE_KEY = 'sharpquill:active-id'
const MEMORY_KEY = 'sharpquill:documents-fallback'

function canUseIdb() {
  return typeof indexedDB !== 'undefined'
}

function readMemory(): QuillDocument[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    return raw ? (JSON.parse(raw) as QuillDocument[]) : []
  } catch {
    return []
  }
}

function writeMemory(docs: QuillDocument[]) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(docs))
  } catch {
    // Ignore quota errors.
  }
}

export async function listDocuments() {
  if (canUseIdb()) {
    try {
      return await idbGetAll<QuillDocument>('documents')
    } catch {
      return readMemory()
    }
  }
  return readMemory()
}

export async function getDocument(id: string) {
  if (canUseIdb()) {
    try {
      return (await idbGet<QuillDocument>('documents', id)) ?? null
    } catch {
      return readMemory().find((doc) => doc.id === id) ?? null
    }
  }
  return readMemory().find((doc) => doc.id === id) ?? null
}

export async function putDocument(doc: QuillDocument) {
  if (canUseIdb()) {
    try {
      await idbPut('documents', doc)
      return
    } catch {
      // Fall through to localStorage.
    }
  }
  const docs = readMemory().filter((item) => item.id !== doc.id)
  docs.push(doc)
  writeMemory(docs)
}

export async function deleteDocument(id: string) {
  if (canUseIdb()) {
    try {
      await idbDelete('documents', id)
      return
    } catch {
      // Fall through.
    }
  }
  writeMemory(readMemory().filter((doc) => doc.id !== id))
}

export async function replaceAllDocuments(docs: QuillDocument[]) {
  if (canUseIdb()) {
    try {
      await idbClear('documents')
      for (const doc of docs) await idbPut('documents', doc)
      writeMemory(docs)
      return
    } catch {
      // Fall through.
    }
  }
  writeMemory(docs)
}

export function getActiveId() {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function setActiveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    // Ignore.
  }
}

export async function migrateLegacyDocument() {
  const existing = await listDocuments()
  if (existing.length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { title?: string; html?: string; markdown?: string }
    const doc = emptyDocument({
      title: parsed.title ?? '',
      content: parsed.html || parsed.markdown || '',
    })
    await putDocument(doc)
    setActiveId(doc.id)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Ignore malformed legacy data.
  }
}

export function sortDocuments(docs: QuillDocument[], sort: 'updated' | 'title') {
  return [...docs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sort === 'title') {
      return (a.title || 'Untitled').localeCompare(b.title || 'Untitled', undefined, {
        sensitivity: 'base',
      })
    }
    return b.updatedAt - a.updatedAt
  })
}
