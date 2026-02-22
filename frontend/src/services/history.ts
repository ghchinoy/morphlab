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

import { get, update, del } from 'idb-keyval'

export interface HistoryItem {
  id: string
  originalSvg: string
  action: string
  resultSvg: string
  timestamp: number
}

const HISTORY_KEY = 'morphlab_history'

export const historyService = {
  async getHistory(): Promise<HistoryItem[]> {
    const history = await get<HistoryItem[]>(HISTORY_KEY)
    return history || []
  },

  async addHistoryItem(item: HistoryItem): Promise<void> {
    await update(HISTORY_KEY, (val) => {
      const history = (val as HistoryItem[]) || []
      return [item, ...history] // prepend newest
    })
  },

  async deleteHistoryItem(id: string): Promise<void> {
    await update(HISTORY_KEY, (val) => {
      const history = (val as HistoryItem[]) || []
      return history.filter((item: HistoryItem) => item.id !== id)
    })
  },

  async clearHistory(): Promise<void> {
    await del(HISTORY_KEY)
  }
}
