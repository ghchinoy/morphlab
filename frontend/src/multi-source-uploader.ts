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
import { customElement, state } from 'lit/decorators.js';
import ImageTracer from 'imagetracerjs';
import type { ImageTracerOptions } from 'imagetracerjs';

@customElement('multi-source-uploader')
export class MultiSourceUploader extends LitElement {
  @state() private activeTab: 'svg' | 'png' | 'paste' = 'svg';
  @state() private rawPasteText = '';
  @state() private isTracing = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }

    .tab {
      padding: 0.5rem 1rem;
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;
      font-family: inherit;
    }

    .tab:hover {
      color: #fff;
    }

    .tab.active {
      color: #1f68f9;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -0.6rem;
      left: 0;
      right: 0;
      height: 2px;
      background: #1f68f9;
      border-radius: 2px 2px 0 0;
      box-shadow: 0 -2px 10px rgba(31, 104, 249, 0.5);
    }

    .badge {
      font-size: 0.6rem;
      background: rgba(31, 104, 249, 0.2);
      color: #1f68f9;
      padding: 0.1rem 0.4rem;
      border-radius: 8px;
      margin-left: 0.4rem;
      vertical-align: middle;
    }

    .tab-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 200px;
    }

    .dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.02);
      color: #aaa;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .dropzone:hover,
    .dropzone.dragover {
      border-color: #1f68f9;
      background: rgba(31, 104, 249, 0.05);
      color: #fff;
    }

    .dropzone svg {
      width: 48px;
      height: 48px;
      fill: currentColor;
    }

    input[type='file'] {
      display: none;
    }

    textarea {
      width: 100%;
      height: 200px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #0f0;
      font-family: monospace;
      padding: 1rem;
      resize: vertical;
      outline: none;
    }

    textarea:focus {
      border-color: #1f68f9;
    }

    .action-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .btn-apply {
      padding: 0.6rem 1.2rem;
      background: #1f68f9;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-apply:hover {
      background: #3b7cf9;
    }

    .tracing-overlay {
      color: #1f68f9;
      font-weight: bold;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.5;
      }
    }
  `;

  private handleSvgDrop(e: DragEvent) {
    this.prevent(e);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.readSvgFile(e.dataTransfer.files[0]);
    }
  }

  private handleSvgSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.readSvgFile(input.files[0]);
    }
  }

  private readSvgFile(file: File) {
    if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
      this.dispatchError('Please upload a valid .svg file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => this.dispatchLoaded(e.target?.result as string);
    reader.readAsText(file);
  }

  private handlePngDrop(e: DragEvent) {
    this.prevent(e);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.tracePngFile(e.dataTransfer.files[0]);
    }
  }

  private handlePngSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.tracePngFile(input.files[0]);
    }
  }

  private tracePngFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.dispatchError('Please upload an image file (PNG/JPG/WebP).');
      return;
    }

    this.isTracing = true;
    const url = URL.createObjectURL(file);

    // Aggressively optimize imagetracerjs output to prevent massive SVG generation.
    // This reduces output from ~65KB down to <10KB so Gemini can animate it without token truncation.
    const tracerOptions: ImageTracerOptions = {
      corsenabled: false,
      ltres: 5,
      qtres: 5,
      pathomit: 64,
      colorsampling: 1,
      numberofcolors: 2,
      mincolorratio: 0.1,
      colorquantcycles: 3,
      scale: 1,
      simplifytolerance: 0.5,
      roundcoords: 0,
    };

    ImageTracer.imageToSVG(
      url,
      (svgString: string) => {
        this.isTracing = false;
        URL.revokeObjectURL(url);
        this.dispatchLoaded(svgString);
      },
      tracerOptions,
    );
  }

  private handlePasteApply() {
    const trimmed = this.rawPasteText.trim();
    if (trimmed.toLowerCase().includes('<svg') && trimmed.toLowerCase().includes('</svg>')) {
      this.dispatchLoaded(trimmed);
    } else {
      this.dispatchError('Please paste valid SVG markup containing <svg>...</svg>.');
    }
  }

  private prevent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  private dispatchLoaded(svgData: string) {
    this.dispatchEvent(
      new CustomEvent('svg-loaded', {
        detail: svgData,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private dispatchError(message: string) {
    this.dispatchEvent(
      new CustomEvent('upload-error', {
        detail: message,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="tabs">
        <button
          class="tab ${this.activeTab === 'svg' ? 'active' : ''}"
          @click=${() => (this.activeTab = 'svg')}
        >
          Upload SVG
        </button>
        <button
          class="tab ${this.activeTab === 'png' ? 'active' : ''}"
          @click=${() => (this.activeTab = 'png')}
        >
          Upload Image <span class="badge">Trace</span>
        </button>
        <button
          class="tab ${this.activeTab === 'paste' ? 'active' : ''}"
          @click=${() => (this.activeTab = 'paste')}
        >
          Paste XML
        </button>
      </div>

      <div class="tab-content">
        ${this.activeTab === 'svg'
          ? html`
              <div
                class="dropzone"
                @dragover=${this.prevent}
                @drop=${this.handleSvgDrop}
                @click=${() =>
                  (this.shadowRoot?.querySelector('#svg-input') as HTMLInputElement)?.click()}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19 13v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m4-4l3-3m0 0l3 3m-3-3v12" />
                </svg>
                <div>Drop a native .svg file here</div>
                <input id="svg-input" type="file" accept=".svg" @change=${this.handleSvgSelect} />
              </div>
            `
          : ''}
        ${this.activeTab === 'png'
          ? html`
              <div
                class="dropzone"
                @dragover=${this.prevent}
                @drop=${this.handlePngDrop}
                @click=${() =>
                  !this.isTracing &&
                  (this.shadowRoot?.querySelector('#png-input') as HTMLInputElement)?.click()}
              >
                ${this.isTracing
                  ? html`<div class="tracing-overlay">Tracing Pixels to Vectors...</div>`
                  : html`
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                        />
                      </svg>
                      <div>Drop a PNG/JPG. We will auto-trace it into vectors!</div>
                    `}
                <input
                  id="png-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  @change=${this.handlePngSelect}
                  ?disabled=${this.isTracing}
                />
              </div>
            `
          : ''}
        ${this.activeTab === 'paste'
          ? html`
              <div>
                <textarea
                  placeholder="<svg viewBox='0 0 100 100'>
  <circle cx='50' cy='50' r='40' />
</svg>"
                  .value=${this.rawPasteText}
                  @input=${(e: Event) =>
                    (this.rawPasteText = (e.target as HTMLTextAreaElement).value)}
                ></textarea>
                <div class="action-row">
                  <button
                    class="btn-apply"
                    @click=${this.handlePasteApply}
                    ?disabled=${!this.rawPasteText}
                  >
                    Load XML
                  </button>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'multi-source-uploader': MultiSourceUploader;
  }
}
