import { createId, idbDelete, idbGet, idbPut, type StoredImage } from './idb'

const urlCache = new Map<string, string>()

export const IMAGE_PREFIX = 'quill-img:'

export function isStoredImageSrc(src: string) {
  return src.startsWith(IMAGE_PREFIX) || src.startsWith('blob:') || src.startsWith('data:')
}

export async function saveImageBlob(blob: Blob) {
  const image: StoredImage = {
    id: createId(),
    mime: blob.type || 'image/png',
    blob,
    createdAt: Date.now(),
  }
  try {
    await idbPut('images', image)
  } catch {
    // IndexedDB unavailable — caller can still use a data URL.
  }
  const url = URL.createObjectURL(blob)
  urlCache.set(image.id, url)
  return { id: image.id, src: `${IMAGE_PREFIX}${image.id}`, preview: url }
}

export async function resolveImageSrc(src: string) {
  if (!src.startsWith(IMAGE_PREFIX)) return src
  const id = src.slice(IMAGE_PREFIX.length)
  const cached = urlCache.get(id)
  if (cached) return cached
  try {
    const stored = await idbGet<StoredImage>('images', id)
    if (!stored) return src
    const url = URL.createObjectURL(stored.blob)
    urlCache.set(id, url)
    return url
  } catch {
    return src
  }
}

export async function imageToDataUrl(src: string) {
  if (src.startsWith('data:')) return src
  const resolved = await resolveImageSrc(src)
  if (resolved.startsWith('data:')) return resolved
  const response = await fetch(resolved)
  const blob = await response.blob()
  return blobToDataUrl(blob)
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function dataUrlToStoredImage(dataUrl: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return saveImageBlob(blob)
}

export async function removeImage(id: string) {
  const url = urlCache.get(id)
  if (url) URL.revokeObjectURL(url)
  urlCache.delete(id)
  try {
    await idbDelete('images', id)
  } catch {
    // Ignore.
  }
}
