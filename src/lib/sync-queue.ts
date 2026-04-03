import { openDB, type IDBPDatabase } from 'idb'
import supabase from './supabase'

interface SyncItem {
  id: string
  table: string
  action: 'upsert' | 'delete'
  match: Record<string, unknown>
  data?: Record<string, unknown>
  retries: number
  timestamp: number
}

let db: IDBPDatabase

async function getDB() {
  if (!db) db = await openDB('teretana-sync', 1, {
    upgrade(db) { db.createObjectStore('queue', { keyPath: 'id' }) }
  })
  return db
}

export async function enqueue(table: string, action: 'upsert' | 'delete', match: Record<string, unknown>, data?: Record<string, unknown>) {
  const d = await getDB()
  await d.put('queue', { id: crypto.randomUUID(), table, action, match, data, retries: 0, timestamp: Date.now() })
}

export async function processQueue() {
  const d = await getDB()
  const items: SyncItem[] = await d.getAll('queue')
  for (const item of items) {
    try {
      if (item.action === 'delete') {
        await supabase.from(item.table).delete().match(item.match)
      } else if (item.data) {
        await supabase.from(item.table).delete().match(item.match)
        const { error } = await supabase.from(item.table).insert(item.data)
        if (error) throw error
      }
      await d.delete('queue', item.id)
    } catch {
      if (item.retries >= 3) { await d.delete('queue', item.id); console.error('Sync dropped after 3 retries:', item) }
      else await d.put('queue', { ...item, retries: item.retries + 1 })
    }
  }
}

// Process queue on app start and when coming back online
export function initSyncQueue() {
  processQueue().catch(() => {})
  window.addEventListener('online', () => processQueue().catch(() => {}))
}

// Try sync, fallback to queue
export async function syncOrQueue(table: string, match: Record<string, unknown>, data: Record<string, unknown>) {
  try {
    await supabase.from(table).delete().match(match)
    const { error } = await supabase.from(table).insert(data)
    if (error) throw error
  } catch {
    await enqueue(table, 'upsert', match, data)
  }
}

export async function deleteOrQueue(table: string, match: Record<string, unknown>) {
  try {
    await supabase.from(table).delete().match(match)
  } catch {
    await enqueue(table, 'delete', match)
  }
}
