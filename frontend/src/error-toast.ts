/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('error-toast')
export class ErrorToast extends LitElement {
  @property({ type: String }) message: string | null = null;

  static styles = css`
    :host {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1200;
      pointer-events: none;
      font-family: 'Space Grotesk', system-ui, sans-serif;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 300px;
      max-width: min(600px, 90vw);
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      background: rgba(36, 16, 20, 0.92);
      border: 1px solid rgba(255, 82, 82, 0.45);
      color: #ffb4b4;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      opacity: 0;
      transform: translateY(16px);
      transition:
        opacity 0.25s ease,
        transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }

    .toast.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #ff5252;
    }

    .message {
      flex: 1;
      font-size: 0.92rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .dismiss-btn {
      background: transparent;
      border: none;
      color: #ffb4b4;
      cursor: pointer;
      padding: 0.25rem 0.45rem;
      border-radius: 6px;
      font-size: 1.15rem;
      line-height: 1;
      transition: background 0.2s;
    }

    .dismiss-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  `;

  private handleDismiss() {
    this.dispatchEvent(
      new CustomEvent('dismiss-error', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="toast ${this.message ? 'visible' : ''}" role="alert" aria-live="polite">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div class="message">${this.message ?? ''}</div>
        <button class="dismiss-btn" @click=${this.handleDismiss} aria-label="Dismiss error">
          &times;
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'error-toast': ErrorToast;
  }
}
