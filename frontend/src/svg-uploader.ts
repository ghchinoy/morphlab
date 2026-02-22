import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('svg-uploader')
export class SvgUploader extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: 1rem;
    }

    .dropzone {
      border: 2px dashed #444;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.05);
      color: #aaa;
    }

    .dropzone:hover, .dropzone.dragover {
      border-color: #1f68f9;
      background: rgba(31, 104, 249, 0.1);
      color: #fff;
    }

    input[type="file"] {
      display: none;
    }

    svg {
      width: 48px;
      height: 48px;
      fill: currentColor;
      margin-bottom: 1rem;
    }
  `

  private handleDragOver(e: DragEvent) {
    e.preventDefault()
    this.shadowRoot?.querySelector('.dropzone')?.classList.add('dragover')
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault()
    this.shadowRoot?.querySelector('.dropzone')?.classList.remove('dragover')
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault()
    this.shadowRoot?.querySelector('.dropzone')?.classList.remove('dragover')
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.readFile(e.dataTransfer.files[0])
    }
  }

  private handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.readFile(input.files[0])
    }
  }

  private readFile(file: File) {
    if (file.type !== 'image/svg+xml') {
      alert('Please upload an SVG file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      this.dispatchEvent(new CustomEvent('svg-loaded', {
        detail: content,
        bubbles: true,
        composed: true
      }))
    }
    reader.readAsText(file)
  }

  render() {
    return html`
      <div 
        class="dropzone"
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
        @click=${() => this.shadowRoot?.querySelector('input')?.click()}
      >
        <svg viewBox="0 0 24 24">
          <path d="M19 13v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m4-4l3-3m0 0l3 3m-3-3v12"/>
        </svg>
        <br>
        Click or drag & drop an SVG file here
        <input type="file" accept=".svg" @change=${this.handleFileSelect} />
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'svg-uploader': SvgUploader
  }
}
