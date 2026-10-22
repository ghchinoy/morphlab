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

export const SVG_COMPLEXITY_THRESHOLD = 15000;

export type SvgParseResult = { ok: true; dataUrl: string } | { ok: false; error: string };

/**
 * Checks whether an SVG string exceeds the recommended byte/character threshold
 * for single-pass LLM token reconstruction.
 */
export function isComplexSvg(svgContent: string | null | undefined): boolean {
  return Boolean(svgContent && svgContent.length > SVG_COMPLEXITY_THRESHOLD);
}

/**
 * Parses raw SVG XML, normalizes its viewBox for responsive scaling, and encodes
 * it into a sandboxed `data:image/svg+xml;utf8,...` URL so CSS animations do not
 * bleed across multiple instances in the DOM.
 */
export function parseSvgToDataUrl(rawSvg: string): SvgParseResult {
  if (!rawSvg || !rawSvg.trim()) {
    return { ok: false, error: 'Empty SVG content' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    return {
      ok: false,
      error: errorNode.textContent || 'Malformed SVG XML syntax',
    };
  }

  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    return {
      ok: false,
      error: 'Missing root <svg> element',
    };
  }

  if (
    !svgEl.hasAttribute('viewBox') &&
    svgEl.hasAttribute('width') &&
    svgEl.hasAttribute('height')
  ) {
    const w = svgEl.getAttribute('width')?.replace(/[^0-9.]/g, '');
    const h = svgEl.getAttribute('height')?.replace(/[^0-9.]/g, '');
    if (w && h) {
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
  }

  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');

  const svgString = new XMLSerializer().serializeToString(svgEl);
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  return { ok: true, dataUrl };
}

/**
 * Triggers a browser file download for an SVG string.
 */
export function downloadSvgFile(svgContent: string, filename = 'animated-result.svg'): void {
  if (!svgContent) return;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
