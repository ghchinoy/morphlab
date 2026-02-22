import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './app-bar'
import './svg-uploader'
import './svg-viewer'
import './history-carousel'
import { historyService } from './services/history'
import type { HistoryItem } from './services/history'

@customElement('svg-animator-app')
export class SvgAnimatorApp extends LitElement {
  @state() private originalSvg: string | null = null
  @state() private transformedSvg: string | null = null
  @state() private actionPrompt: string = ''
  @state() private isLoading = false
  @state() private error: string | null = null
  @state() private history: HistoryItem[] = []
  
  @state() private selectedHistoryItem: HistoryItem | null = null
  
  @state() private loadingPhraseIndex = 0
  private loadingPhrases = [
    "Analyzing SVG topology...",
    "Injecting SMIL animations...",
    "Applying CSS keyframes...",
    "Rebuilding path data...",
    "Almost there..."
  ]
  private loadingTimer: number | null = null

  private presets = [
    "Draw path outline organically",
    "Neon cyberpunk glitch",
    "Breathe and float gently",
    "Spin with 3D perspective",
    "Pulse with vivid sunset colors",
    "Liquid morphing bubble effect"
  ]

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: #121212;
      color: #e0e0e0;
      font-family: 'Space Grotesk', system-ui, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      gap: 2rem;
    }

    .prompt-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .presets-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .chip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #aaa;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chip:hover {
      background: rgba(31, 104, 249, 0.1);
      color: #fff;
      border-color: #1f68f9;
      transform: translateY(-2px);
    }

    .editor-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .panel-header {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-bar {
      grid-column: 1 / -1;
      display: flex;
      gap: 1rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .prompt-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.2rem;
      padding: 0.5rem;
      font-family: 'Space Grotesk', sans-serif;
      outline: none;
    }

    .prompt-input::placeholder {
      color: #555;
    }

    .generate-btn {
      padding: 1rem 2.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #1f68f9, #a855f7);
      color: #fff;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
    }

    .generate-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
    }

    .generate-btn:disabled {
      background: #333;
      color: #666;
      cursor: not-allowed;
      box-shadow: none;
    }

    .error-msg {
      grid-column: 1 / -1;
      color: #ff5252;
      background: rgba(255, 82, 82, 0.1);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 82, 82, 0.3);
      text-align: center;
    }

    .history-section {
      margin-top: auto;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 2rem;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(18, 18, 18, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-radius: 12px;
      z-index: 10;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #1f68f9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    .loading-text {
      background: linear-gradient(90deg, #1f68f9, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 600;
      min-height: 1.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Overlay Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-content {
      background: rgba(30, 30, 30, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.open .modal-content {
      transform: scale(1);
    }

    .modal-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .modal-prompt {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
    }

    .modal-time {
      font-size: 0.85rem;
      color: #888;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      line-height: 1;
      transition: color 0.2s, background 0.2s;
    }

    .close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 2rem;
      flex: 1;
      overflow-y: auto;
      display: flex;
      justify-content: center;
    }

    .modal-svg-container {
      width: 100%;
      max-height: 500px;
      background: #f0f0f0;
      background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .modal-actions {
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      align-items: center;
    }

    .btn-group {
      display: flex;
      gap: 1rem;
    }

    .btn-outline {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: transparent;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .btn-danger {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: 1px solid rgba(255, 82, 82, 0.5);
      border-radius: 8px;
      background: rgba(255, 82, 82, 0.1);
      color: #ff5252;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: rgba(255, 82, 82, 0.2);
      border-color: #ff5252;
    }
  `

  async connectedCallback() {
    super.connectedCallback()
    await this.loadHistory()
  }

  private async loadHistory() {
    this.history = await historyService.getHistory()
  }

  private handleSvgLoaded(e: CustomEvent<string>) {
    this.originalSvg = e.detail
    this.transformedSvg = null
    this.error = null
  }

  private handleHistorySelected(e: CustomEvent<HistoryItem>) {
    this.selectedHistoryItem = e.detail
  }

  private closeModal() {
    this.selectedHistoryItem = null
  }

  private loadHistoryAsSource() {
    if (this.selectedHistoryItem) {
      this.originalSvg = this.selectedHistoryItem.resultSvg
      this.transformedSvg = null
      this.actionPrompt = this.selectedHistoryItem.action
      this.closeModal()
      
      // Optional: scroll back to top smoothly so they can generate
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  private async deleteHistoryItem() {
    if (this.selectedHistoryItem) {
      if (confirm('Are you sure you want to delete this animation from your history?')) {
        await historyService.deleteHistoryItem(this.selectedHistoryItem.id)
        await this.loadHistory()
        this.closeModal()
      }
    }
  }

  private downloadModalSvg() {
    if (!this.selectedHistoryItem) return
    const blob = new Blob([this.selectedHistoryItem.resultSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `morphlab-${this.selectedHistoryItem.timestamp}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private renderSvg(rawSvg: string) {
    if (!rawSvg) return html``
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml')
    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      return html`<div style="color: #ff5252; padding: 2rem; text-align: center;">Malformed SVG Output</div>`
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

  private handlePromptInput(e: Event) {
    this.actionPrompt = (e.target as HTMLInputElement).value
  }

  private async handleGenerate() {
    if (!this.originalSvg || !this.actionPrompt.trim()) return

    this.isLoading = true
    this.error = null
    this.loadingPhraseIndex = 0
    this.loadingTimer = window.setInterval(() => {
      this.loadingPhraseIndex = (this.loadingPhraseIndex + 1) % this.loadingPhrases.length
    }, 2500)

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svg: this.originalSvg,
          action: this.actionPrompt.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transform SVG')
      }

      this.transformedSvg = data.result

      // Save to IndexedDB history
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        originalSvg: this.originalSvg,
        action: this.actionPrompt.trim(),
        resultSvg: this.transformedSvg!,
        timestamp: Date.now()
      }
      
      await historyService.addHistoryItem(historyItem)
      await this.loadHistory()

    } catch (err: any) {
      console.error(err)
      this.error = err.message || 'An error occurred'
    } finally {
      this.isLoading = false
      if (this.loadingTimer) {
        window.clearInterval(this.loadingTimer)
        this.loadingTimer = null
      }
    }
  }

  render() {
    return html`
      <app-bar></app-bar>
      <main>
        
        <div class="prompt-section">
          <div class="action-bar">
            <input 
              class="prompt-input" 
              type="text" 
              placeholder="e.g. Make it breathe and glow softly..." 
              .value=${this.actionPrompt}
              @input=${this.handlePromptInput}
              @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleGenerate()}
              ?disabled=${this.isLoading}
            />
            <button 
              class="generate-btn" 
              ?disabled=${!this.originalSvg || !this.actionPrompt.trim() || this.isLoading}
              @click=${this.handleGenerate}
            >
              Generate
            </button>
          </div>
          
          <div class="presets-container">
            ${this.presets.map(preset => html`
              <div class="chip" @click=${() => this.actionPrompt = preset}>${preset}</div>
            `)}
          </div>
        </div>

        ${this.error ? html`<div class="error-msg">${this.error}</div>` : ''}

        <div class="editor-section">
          <!-- Left Panel: Input -->
          <div class="panel">
            <div class="panel-header">Source SVG</div>
            ${!this.originalSvg 
              ? html`<svg-uploader @svg-loaded=${this.handleSvgLoaded}></svg-uploader>`
              : html`
                  <svg-viewer .svgContent=${this.originalSvg}></svg-viewer>
                  <button @click=${() => { this.originalSvg = null; this.transformedSvg = null; }} style="margin-top:1rem; padding:0.5rem; background:transparent; border:1px solid #444; color:#aaa; border-radius:6px; cursor:pointer;">
                    Upload new SVG
                  </button>
                `
            }
          </div>

          <!-- Right Panel: Output -->
          <div class="panel" style="position: relative;">
            <div class="panel-header">Result SVG</div>
            ${this.isLoading ? html`
              <div class="loading-overlay">
                <div class="spinner"></div>
                <div class="loading-text">${this.loadingPhrases[this.loadingPhraseIndex]}</div>
              </div>
            ` : ''}
            
            ${this.transformedSvg 
              ? html`<svg-viewer .svgContent=${this.transformedSvg}></svg-viewer>`
              : html`
                  <div style="flex:1; display:flex; justify-content:center; align-items:center; color:#555; border: 2px dashed rgba(255,255,255,0.05); border-radius: 8px; min-height: 400px;">
                    Result will appear here
                  </div>
                `
            }
          </div>
        </div>

        <div class="history-section">
          <div class="panel-header" style="font-size: 1.1rem; color: #888; margin-bottom: 0;">History</div>
          <history-carousel 
            .items=${this.history}
            @history-selected=${this.handleHistorySelected}
          ></history-carousel>
        </div>

      </main>

      <!-- History Item Lightbox Modal -->
      <div class="modal-overlay ${this.selectedHistoryItem ? 'open' : ''}" @click=${(e: Event) => e.target === e.currentTarget && this.closeModal()}>
        <div class="modal-content">
          ${this.selectedHistoryItem ? html`
            <div class="modal-header">
              <div class="modal-title-group">
                <div class="modal-prompt">"${this.selectedHistoryItem.action}"</div>
                <div class="modal-time">${new Date(this.selectedHistoryItem.timestamp).toLocaleString()}</div>
              </div>
              <button class="close-btn" @click=${this.closeModal}>&times;</button>
            </div>
            
            <div class="modal-body">
              <div class="modal-svg-container">
                ${this.renderSvg(this.selectedHistoryItem.resultSvg)}
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-danger" @click=${this.deleteHistoryItem}>Delete</button>
              
              <div class="btn-group">
                <button class="btn-outline" @click=${this.downloadModalSvg}>Download SVG</button>
                <button class="generate-btn" @click=${this.loadHistoryAsSource} style="padding: 0.8rem 1.5rem;">Use as Source</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'svg-animator-app': SvgAnimatorApp
  }
}
