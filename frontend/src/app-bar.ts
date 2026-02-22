import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('app-bar')
export class AppBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1600px;
      margin: 0 auto;
      padding: 1.25rem 2rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #1f68f9, #a855f7);
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
    }

    .logo svg {
      width: 20px;
      height: 20px;
      fill: #fff;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }

    .badge {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      color: #aaa;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  `

  render() {
    return html`
      <header class="header-container">
        <div class="brand">
          <div class="logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>MorphLab</h1>
          <span class="badge">BETA</span>
        </div>
      </header>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-bar': AppBar
  }
}
