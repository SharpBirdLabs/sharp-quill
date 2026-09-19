const DB_NAME = 'sharpquill'
const DB_VERSION = 1

export type QuillDocument = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  pinned: boolean
}

export type StoredImage = {
  id: string
  mime: string
  blob: Blob
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function asPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbGetAll<T>(store: 'documents' | 'images') {
  const db = await openDb()
  return asPromise<T[]>(db.transaction(store, 'readonly').objectStore(store).getAll())
}

export async function idbGet<T>(store: 'documents' | 'images', id: string) {
  const db = await openDb()
  return asPromise<T | undefined>(db.transaction(store, 'readonly').objectStore(store).get(id))
}

export async function idbPut(store: 'documents' | 'images', value: unknown) {
  const db = await openDb()
  await asPromise(db.transaction(store, 'readwrite').objectStore(store).put(value))
}

export async function idbDelete(store: 'documents' | 'images', id: string) {
  const db = await openDb()
  await asPromise(db.transaction(store, 'readwrite').objectStore(store).delete(id))
}

export async function idbClear(store: 'documents' | 'images') {
  const db = await openDb()
  await asPromise(db.transaction(store, 'readwrite').objectStore(store).clear())
}

export function createId() {
  return crypto.randomUUID()
}

export function emptyDocument(partial?: Partial<QuillDocument>): QuillDocument {
  const now = Date.now()
  return {
    id: partial?.id ?? createId(),
    title: partial?.title ?? '',
    content: partial?.content ?? '',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    pinned: partial?.pinned ?? false,
  }
}
