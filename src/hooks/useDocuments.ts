import { useCallback, useEffect, useState } from 'react'
import {
  deleteDocument,
  getActiveId,
  listDocuments,
  migrateLegacyDocument,
  putDocument,
  replaceAllDocuments,
  setActiveId as persistActiveId,
  sortDocuments,
} from '../lib/documents'
import { emptyDocument, type QuillDocument } from '../lib/idb'

let bootPromise: Promise<{ list: QuillDocument[]; activeId: string }> | null = null

async function bootDocuments() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await migrateLegacyDocument()
      let list = await listDocuments()
      if (list.length === 0) {
        const doc = emptyDocument()
        await putDocument(doc)
        list = [doc]
      }
      const stored = getActiveId()
      const activeId =
        stored && list.some((doc) => doc.id === stored)
          ? stored
          : sortDocuments(list, 'updated')[0].id
      persistActiveId(activeId)
      return { list, activeId }
    })()
  }
  return bootPromise
}

export function useDocuments() {
  const [docs, setDocs] = useState<QuillDocument[]>([])
  const [activeId, setActiveIdState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    setDocs(await listDocuments())
  }, [])

  useEffect(() => {
    void bootDocuments().then(({ list, activeId: nextId }) => {
      setDocs(list)
      setActiveIdState(nextId)
      setReady(true)
    })
  }, [])

  const select = useCallback((id: string) => {
    setActiveIdState(id)
    persistActiveId(id)
  }, [])

  const create = useCallback(async (partial?: Partial<QuillDocument>) => {
    const doc = emptyDocument(partial)
    await putDocument(doc)
    setDocs((current) => [...current.filter((item) => item.id !== doc.id), doc])
    select(doc.id)
    return doc
  }, [select])

  const save = useCallback(async (doc: QuillDocument) => {
    await putDocument(doc)
    setDocs((current) => current.map((item) => (item.id === doc.id ? doc : item)))
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    const current = docs.find((doc) => doc.id === id)
    if (!current) return
    await save({ ...current, title, updatedAt: Date.now() })
  }, [docs, save])

  const togglePin = useCallback(async (id: string) => {
    const current = docs.find((doc) => doc.id === id)
    if (!current) return
    await save({ ...current, pinned: !current.pinned, updatedAt: Date.now() })
  }, [docs, save])

  const remove = useCallback(async (id: string) => {
    await deleteDocument(id)
    let remaining = docs.filter((doc) => doc.id !== id)
    if (remaining.length === 0) {
      const doc = emptyDocument()
      await putDocument(doc)
      remaining = [doc]
    }
    setDocs(remaining)
    if (activeId === id) {
      const next = sortDocuments(remaining, 'updated')[0]
      select(next.id)
    }
    return remaining
  }, [activeId, docs, select])

  const replaceAll = useCallback(async (next: QuillDocument[], active?: string) => {
    const list = next.length > 0 ? next : [emptyDocument()]
    await replaceAllDocuments(list)
    setDocs(list)
    const nextId = active && list.some((doc) => doc.id === active)
      ? active
      : sortDocuments(list, 'updated')[0].id
    select(nextId)
  }, [select])

  const mergeIn = useCallback(async (incoming: QuillDocument[]) => {
    const map = new Map(docs.map((doc) => [doc.id, doc]))
    for (const doc of incoming) {
      const existing = map.get(doc.id)
      if (!existing || doc.updatedAt >= existing.updatedAt) {
        map.set(doc.id, doc)
      }
    }
    const list = [...map.values()]
    await replaceAllDocuments(list)
    setDocs(list)
    return list
  }, [docs])

  const active = docs.find((doc) => doc.id === activeId) ?? null

  return {
    docs,
    active,
    activeId,
    ready,
    refresh,
    select,
    create,
    save,
    rename,
    togglePin,
    remove,
    replaceAll,
    mergeIn,
  }
}
