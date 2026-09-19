import Image from '@tiptap/extension-image'
import { IMAGE_PREFIX, resolveImageSrc } from '../lib/images'

export const StoredImage = Image.extend({
  name: 'image',
  addNodeView() {
    return ({ node }) => {
      const img = document.createElement('img')
      img.alt = node.attrs.alt ?? ''
      if (node.attrs.title) img.title = node.attrs.title
      img.loading = 'lazy'
      img.draggable = true

      const applySrc = (src: string) => {
        if (src.startsWith(IMAGE_PREFIX)) {
          void resolveImageSrc(src).then((url) => {
            img.src = url
          })
        } else {
          img.src = src
        }
      }

      applySrc(node.attrs.src ?? '')

      return {
        dom: img,
        update(updated) {
          if (updated.type.name !== 'image') return false
          img.alt = updated.attrs.alt ?? ''
          img.title = updated.attrs.title ?? ''
          applySrc(updated.attrs.src ?? '')
          return true
        },
      }
    }
  },
}).configure({
  inline: false,
  allowBase64: true,
  HTMLAttributes: {
    class: 'quill-image',
  },
})
