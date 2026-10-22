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
import { downloadSvgFile, parseSvgToDataUrl } from './utils/svg';

@customElement('svg-viewer')
export class SvgViewer extends LitElement {
  @property({ type: String }) svgContent = '';

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
      background-position:
        0 0,
        0 10px,
        10px -10px,
        -10px 0px;

      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
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
  `;

  private downloadSvg() {
    downloadSvgFile(this.svgContent, 'animated-result.svg');
  }

  private renderSvg(rawSvg: string) {
    if (!rawSvg) return html``;
    const parsed = parseSvgToDataUrl(rawSvg);
    if (!parsed.ok) {
      console.error('SVG Parsing Error:', parsed.error);
      return html`<div style="color: #ff5252; padding: 2rem; text-align: center;">
        <strong>Malformed SVG Output</strong><br />
        The AI generated invalid SVG syntax. Please try generating again or modifying your prompt.
      </div>`;
    }

    return html`<img
      src="${parsed.dataUrl}"
      style="width: 100%; height: 100%; object-fit: contain; max-width: 100%; max-height: 100%; display: block; margin: auto;"
      alt="Animated SVG Result"
    />`;
  }

  render() {
    return html`
      <div class="viewer-container">${this.renderSvg(this.svgContent)}</div>
      <div class="controls">
        <button @click=${this.downloadSvg}>Download SVG</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'svg-viewer': SvgViewer;
  }
}
