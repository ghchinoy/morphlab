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
import type { HistoryItem } from './services/history';
import { parseSvgToDataUrl } from './utils/svg';

@customElement('history-carousel')
export class HistoryCarousel extends LitElement {
  @property({ type: Array }) items: HistoryItem[] = [];

  static styles = css`
    :host {
      display: block;
      width: 100%;
      padding: 1rem 0;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: thin;
      scrollbar-color: #444 #121212;
    }

    * {
      box-sizing: border-box;
    }

    ::-webkit-scrollbar {
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #121212;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #444;
      border-radius: 4px;
    }

    .carousel-container {
      display: inline-flex;
      gap: 1rem;
      padding: 0 2rem;
    }

    .history-card {
      display: flex;
      flex-direction: column;
      width: 180px;
      height: 220px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    }

    .history-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(31, 104, 249, 0.2);
      border-color: rgba(31, 104, 249, 0.5);
    }

    .thumbnail {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f0f0f0;
      background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 10px 10px;
      background-position:
        0 0,
        0 5px,
        5px -5px,
        -5px 0px;
      overflow: hidden;
      padding: 0.5rem;
    }

    .meta {
      padding: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.4);
    }

    .action-text {
      font-size: 0.8rem;
      color: #e0e0e0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .time-text {
      font-size: 0.7rem;
      color: #888;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #666;
      width: 100%;
      font-style: italic;
    }
  `;

  private handleCardClick(item: HistoryItem) {
    this.dispatchEvent(
      new CustomEvent('history-selected', {
        detail: item,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderSvg(rawSvg: string) {
    if (!rawSvg) return html``;
    const parsed = parseSvgToDataUrl(rawSvg);
    if (!parsed.ok) {
      return html`<div
        style="color: #ff5252; padding: 1rem; text-align: center; font-size: 0.8rem;"
      >
        Malformed SVG
      </div>`;
    }

    return html`<img
      src="${parsed.dataUrl}"
      style="max-width: 100%; max-height: 100%; width: auto; height: auto; margin: auto; display: block; object-fit: contain;"
      alt="History Thumbnail"
    />`;
  }

  render() {
    if (this.items.length === 0) {
      return html`<div class="empty-state">Your generation history will appear here.</div>`;
    }

    return html`
      <div class="carousel-container">
        ${this.items.map(
          (item) => html`
            <div class="history-card" @click=${() => this.handleCardClick(item)}>
              <div class="thumbnail">${this.renderSvg(item.resultSvg)}</div>
              <div class="meta">
                <div class="action-text" title="${item.action}">${item.action}</div>
                <div class="time-text">${new Date(item.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'history-carousel': HistoryCarousel;
  }
}
