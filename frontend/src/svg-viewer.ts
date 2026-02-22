import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('svg-viewer')
export class SvgViewer extends LitElement {
  @property({ type: String }) svgContent = ''

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }

    * {
      box-sizing: border-box;
    }

    .viewer-container {
      width: 100%;
      height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
      
      /* Checkerboard background for SVG transparency */
      background-color: #f0f0f0;
      background-image: 
        linear-gradient(45deg, #ccc 25%, transparent 25%), 
        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #ccc 75%), 
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;

      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
    }

    .viewer-container svg {
      max-width: 100% !important;
      max-height: 100% !important;
      width: auto;
      height: auto;
    }

    .controls {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    button {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      background: #1f68f9;
      color: #fff;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    button:hover {
      background: #3b7cf9;
    }
  `

  private downloadSvg() {
    if (!this.svgContent) return
    const blob = new Blob([this.svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animated-result.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private renderSvg(rawSvg: string) {
    if (!rawSvg) return html``
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml')
    
    // Check if the AI returned malformed SVG XML
    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      console.error('SVG Parsing Error:', errorNode.textContent)
      return html`<div style="color: #ff5252; padding: 2rem; text-align: center;">
                <strong>Malformed SVG Output</strong><br>
                The AI generated invalid SVG syntax. Please try generating again or modifying your prompt.
              </div>`
    }

    const svgEl = doc.querySelector('svg')
    if (svgEl) {
      if (!svgEl.hasAttribute('viewBox') && svgEl.hasAttribute('width') && svgEl.hasAttribute('height')) {
        const w = svgEl.getAttribute('width')?.replace(/[^0-9.]/g, '')
        const h = svgEl.getAttribute('height')?.replace(/[^0-9.]/g, '')
        if (w && h) {
          svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
        }
      }
      svgEl.removeAttribute('width')
      svgEl.removeAttribute('height')
      
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`
      
      return html`<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain; max-width: 100%; max-height: 100%; display: block; margin: auto;" alt="Animated SVG Result" />`
    }
    return html``
  }

  render() {
    return html`
      <div class="viewer-container">
        ${this.renderSvg(this.svgContent)}
      </div>
      <div class="controls">
        <button @click=${this.downloadSvg}>Download SVG</button>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'svg-viewer': SvgViewer
  }
}
