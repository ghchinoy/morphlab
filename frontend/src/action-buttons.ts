import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('action-buttons')
export class ActionButtons extends LitElement {
  @property({ type: Boolean }) disabled = false

  @state()
  private customAction = ''

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    button {
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #2a2a2a;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      border: 1px solid #444;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(31, 104, 249, 0.4);
      border-color: #1f68f9;
      background: linear-gradient(145deg, #1f68f9, #a855f7);
    }

    .custom-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
      border-top: 1px solid #444;
      padding-top: 1rem;
    }

    input {
      padding: 0.8rem;
      border-radius: 6px;
      border: 1px solid #444;
      background: #111;
      color: #fff;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #1f68f9;
    }
  `

  private dispatchAction(action: string) {
    if (this.disabled) return
    this.dispatchEvent(new CustomEvent('action-selected', {
      detail: action,
      bubbles: true,
      composed: true
    }))
  }

  private handleCustomInput(e: Event) {
    this.customAction = (e.target as HTMLInputElement).value
  }

  private handleCustomSubmit() {
    if (this.customAction.trim() !== '') {
      this.dispatchAction(this.customAction.trim())
    }
  }

  render() {
    return html`
      <button ?disabled=${this.disabled} @click=${() => this.dispatchAction('make it dance with lively movements')}>Dance</button>
      <button ?disabled=${this.disabled} @click=${() => this.dispatchAction('make it jump up and down smoothly')}>Jump</button>
      <button ?disabled=${this.disabled} @click=${() => this.dispatchAction('make it spin continuously in a circle')}>Spin</button>
      <button ?disabled=${this.disabled} @click=${() => this.dispatchAction('pulse its colors radiantly')}>Pulse Colors</button>
      
      <div class="custom-input-group">
        <input 
          type="text" 
          placeholder="Custom action (e.g., breathe, glow)"
          .value=${this.customAction}
          @input=${this.handleCustomInput}
          ?disabled=${this.disabled}
        />
        <button 
          ?disabled=${this.disabled || this.customAction.trim() === ''} 
          @click=${this.handleCustomSubmit}
        >
          Apply Custom Action
        </button>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-buttons': ActionButtons
  }
}
