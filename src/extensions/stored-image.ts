import { mergeAttributes, type NodeViewRenderer, type NodeViewRendererProps } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { IMAGE_PREFIX, resolveImageSrc } from '../lib/images'

function parseSize(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value)
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function sizeFromElement(element: HTMLElement, name: 'width' | 'height') {
  const attr = element.getAttribute(name)
  if (attr) return parseSize(attr)
  return parseSize(element.style[name])
}

function applySize(img: HTMLImageElement, width?: unknown, height?: unknown) {
  const w = parseSize(width)
  const h = parseSize(height)
  if (w) {
    img.style.width = `${w}px`
    img.setAttribute('width', String(w))
  }
  if (h) {
    img.style.height = `${h}px`
    img.setAttribute('height', String(h))
  }
}

function bindResolvedSrc(img: HTMLImageElement, src: string, width?: unknown, height?: unknown) {
  if (!src) return
  applySize(img, width, height)

  if (src.startsWith(IMAGE_PREFIX)) {
    if (img.getAttribute('data-quill-src') === src && img.src.startsWith('blob:')) return
    img.setAttribute('data-quill-src', src)
    void resolveImageSrc(src).then((url) => {
      if (img.getAttribute('data-quill-src') !== src) return
      if (img.src !== url) img.src = url
      applySize(img, width, height)
    })
    return
  }

  img.removeAttribute('data-quill-src')
  if (img.getAttribute('src') !== src) img.src = src
  applySize(img, width, height)
}

function applyAlign(container: HTMLElement, align?: string | null) {
  container.style.justifyContent =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  container.dataset.align = align || 'left'
}

export const StoredImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => sizeFromElement(element, 'width'),
        renderHTML: (attributes) => {
          const width = parseSize(attributes.width)
          return width ? { width: String(width) } : {}
        },
      },
      height: {
        default: null,
        parseHTML: (element) => sizeFromElement(element, 'height'),
        renderHTML: (attributes) => {
          const height = parseSize(attributes.height)
          return height ? { height: String(height) } : {}
        },
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const width = parseSize(HTMLAttributes.width)
    const height = parseSize(HTMLAttributes.height)
    const extraStyle = [
      width ? `width: ${width}px` : '',
      height ? `height: ${height}px` : '',
    ]
      .filter(Boolean)
      .join('; ')
    const style = [HTMLAttributes.style, extraStyle].filter(Boolean).join('; ')
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: style || undefined,
      }),
    ]
  },

  addNodeView() {
    const createParent = this.parent?.() as NodeViewRenderer | null | undefined
    if (!createParent) return null

    return (props: NodeViewRendererProps) => {
      const view = createParent(props)
      const img =
        view.dom instanceof HTMLImageElement
          ? view.dom
          : view.dom.querySelector('img')

      let latest = props.node
      const sync = (node: typeof props.node) => {
        if (img) bindResolvedSrc(img, node.attrs.src ?? '', node.attrs.width, node.attrs.height)
        applyAlign(view.dom as HTMLElement, node.attrs.textAlign)
      }

      sync(latest)
      img?.addEventListener('load', () => sync(latest))

      const originalUpdate = view.update?.bind(view)

      view.update = (updated, decorations, innerDecorations) => {
        const allowed = originalUpdate
          ? originalUpdate(updated, decorations, innerDecorations)
          : updated.type.name === 'image'
        if (!allowed) return false
        latest = updated
        sync(updated)
        return true
      }

      return view
    }
  },
}).configure({
  inline: false,
  allowBase64: true,
  resize: {
    enabled: true,
    alwaysPreserveAspectRatio: true,
    minWidth: 48,
    minHeight: 48,
  },
  HTMLAttributes: {
    class: 'quill-image',
  },
})
