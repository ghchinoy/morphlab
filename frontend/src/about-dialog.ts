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

@customElement('about-dialog')
export class AboutDialog extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) modelName = 'gemini-4-argon';

  static styles = css`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 1100;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }

    .backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .dialog {
      background: rgba(28, 28, 32, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      width: 100%;
      max-width: 680px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      color: #e0e0e0;
      font-family: 'Space Grotesk', system-ui, sans-serif;
    }

    .backdrop.open .dialog {
      transform: scale(1);
    }

    .header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.4rem 0.65rem;
      border-radius: 50%;
      line-height: 1;
      transition:
        color 0.2s,
        background 0.2s;
    }

    .close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .content {
      padding: 1.75rem 2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      line-height: 1.6;
    }

    section h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.05rem;
      color: #60a5fa;
    }

    section p {
      margin: 0;
      font-size: 0.95rem;
      color: #bbb;
    }

    dl {
      margin: 0;
      display: grid;
      gap: 0.9rem;
    }

    dt {
      font-weight: 600;
      color: #c084fc;
      font-size: 0.95rem;
    }

    dd {
      margin: 0.2rem 0 0 0;
      font-size: 0.9rem;
      color: #aaa;
    }

    code {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
      color: #e2e8f0;
      font-size: 0.85rem;
    }

    .footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
    }

    .btn-primary {
      padding: 0.65rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-family: inherit;
      background: linear-gradient(135deg, #1f68f9, #a855f7);
      color: #fff;
      cursor: pointer;
    }
  `;

  private handleClose() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div
        class="backdrop ${this.open ? 'open' : ''}"
        @click=${(e: Event) => e.target === e.currentTarget && this.handleClose()}
      >
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="about-title">
          <div class="header">
            <h2 class="title" id="about-title">About MorphLab</h2>
            <button class="close-btn" @click=${this.handleClose} aria-label="Close dialog">
              &times;
            </button>
          </div>

          <div class="content">
            <section>
              <h3>AI-Powered SVG Animation Studio</h3>
              <p>
                MorphLab transforms static vector graphics into vibrant, production-ready SVG
                animations using Google's <code>${this.modelName}</code> model via the official
                Google GenAI SDK.
              </p>
            </section>

            <section>
              <h3>Sister App Ecosystem</h3>
              <p>
                For high-contrast AI art generation and Cubic Bézier spline tracing, pair MorphLab
                with its sister apps <strong>Mattey Banana</strong> and
                <strong>VectorMatte</strong>. Export your artwork using their
                <em>Graphic (Splines)</em> SVG mode to produce semantic path islands ideal for
                MorphLab animation.
              </p>
            </section>

            <section>
              <h3>Glossary & Architecture</h3>
              <dl>
                <div>
                  <dt>SMIL &amp; CSS Keyframes</dt>
                  <dd>
                    Animations are injected using native SVG <code>&lt;animate&gt;</code>,
                    <code>&lt;animateTransform&gt;</code>, and scoped CSS keyframes.
                  </dd>
                </div>
                <div>
                  <dt>Sandboxed Preview</dt>
                  <dd>
                    Each SVG is rendered inside an isolated data-URI container so CSS selectors and
                    keyframes never bleed across iterations.
                  </dd>
                </div>
                <div>
                  <dt>Complexity Guardrail (15 KB)</dt>
                  <dd>
                    Dense auto-traced vectors (&gt; 15 KB) are automatically simplified or can be
                    pre-optimized with the companion <code>morphcli simplify</code> CLI tool.
                  </dd>
                </div>
                <div>
                  <dt>Generative Loop</dt>
                  <dd>
                    Select any item from your local IndexedDB history carousel and click
                    <em>Use as Source</em> to layer multiple animations iteratively.
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div class="footer">
            <button class="btn-primary" @click=${this.handleClose}>Close</button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'about-dialog': AboutDialog;
  }
}
