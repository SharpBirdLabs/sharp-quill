import {
  emptyDocument,
  idbGet,
  idbPut,
  type QuillDocument,
  type StoredImage,
} from './idb'
import { blobToDataUrl } from './images'
import { downloadFile, slugify } from './markdown'

export type BackupImage = {
  id: string
  mime: string
  dataUrl: string
}

export type BackupPayload = {
  version: 1
  app: 'sharpquill'
  exportedAt: number
  documents: QuillDocument[]
  images: BackupImage[]
}

export function collectImageIds(html: string) {
  const ids = new Set<string>()
  const pattern = /quill-img:([0-9a-f-]{36})/gi
  for (const match of html.matchAll(pattern)) {
    ids.add(match[1])
  }
  return [...ids]
}

export async function buildBackup(documents: QuillDocument[]): Promise<BackupPayload> {
  const ids = new Set<string>()
  for (const doc of documents) {
    for (const id of collectImageIds(doc.content)) ids.add(id)
  }

  const images: BackupImage[] = []
  for (const id of ids) {
    try {
      const stored = await idbGet<StoredImage>('images', id)
      if (!stored) continue
      images.push({
        id: stored.id,
        mime: stored.mime,
        dataUrl: await blobToDataUrl(stored.blob),
      })
    } catch {
      // Skip images that cannot be read.
    }
  }

  return {
    version: 1,
    app: 'sharpquill',
    exportedAt: Date.now(),
    documents,
    images,
  }
}

export function parseBackup(text: string): BackupPayload {
  const parsed = JSON.parse(text) as unknown
  if (Array.isArray(parsed)) {
    return {
      version: 1,
      app: 'sharpquill',
      exportedAt: Date.now(),
      documents: parsed as QuillDocument[],
      images: [],
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Not a SharpQuill backup')
  }
  const data = parsed as Partial<BackupPayload> & { docs?: QuillDocument[] }
  const documents = data.documents ?? data.docs
  if (!Array.isArray(documents)) {
    throw new Error('Not a SharpQuill backup')
  }
  return {
    version: 1,
    app: 'sharpquill',
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : Date.now(),
    documents: documents.map((doc) =>
      emptyDocument({
        id: doc.id,
        title: doc.title ?? '',
        content: doc.content ?? '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        pinned: Boolean(doc.pinned),
      }),
    ),
    images: Array.isArray(data.images) ? data.images : [],
  }
}

export async function restoreBackupImages(images: BackupImage[]) {
  for (const image of images) {
    try {
      const response = await fetch(image.dataUrl)
      const blob = await response.blob()
      await idbPut('images', {
        id: image.id,
        mime: image.mime || blob.type || 'image/png',
        blob,
        createdAt: Date.now(),
      } satisfies StoredImage)
    } catch {
      // Skip unreadable images.
    }
  }
}

export function downloadBackup(payload: BackupPayload) {
  downloadFile(
    `sharpquill-backup-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8',
  )
}

export function downloadMarkdown(title: string, markdown: string) {
  downloadFile(`${slugify(title)}.md`, markdown, 'text/markdown;charset=utf-8')
}

export function pickFile(accept: string) {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.hidden = true
    const cleanup = () => input.remove()
    input.addEventListener(
      'change',
      () => {
        resolve(input.files?.[0] ?? null)
        cleanup()
      },
      { once: true },
    )
    document.body.appendChild(input)
    input.click()
  })
}
