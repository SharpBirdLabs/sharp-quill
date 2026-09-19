import { htmlWithResolvedImages, slugify, wrapHtmlDocument } from './markdown'

export async function exportPdf(title: string, html: string) {
  const html2pdf = (await import('html2pdf.js')).default
  const resolved = await htmlWithResolvedImages(html)
  const container = document.createElement('div')
  container.innerHTML = wrapHtmlDocument(title, resolved)
  const body = container.querySelector('body') ?? container
  body.style.color = '#1c1917'
  body.style.background = '#ffffff'
  body.style.padding = '8px'
  await html2pdf()
    .set({
      margin: 12,
      filename: `${slugify(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(body)
    .save()
}
