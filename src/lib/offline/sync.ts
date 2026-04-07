import { getQueue, removeFromQueue } from './queue'

export type SyncStatus = 'idle' | 'syncing' | 'error'

let syncStatus: SyncStatus = 'idle'
let syncListeners: ((status: SyncStatus, pending: number) => void)[] = []

export function onSyncStatus(cb: (status: SyncStatus, pending: number) => void) {
  syncListeners.push(cb)
  return () => { syncListeners = syncListeners.filter(l => l !== cb) }
}

function notify(status: SyncStatus, pending: number) {
  syncStatus = status
  syncListeners.forEach(l => l(status, pending))
}

export async function syncQueue(accessToken: string): Promise<void> {
  const queue = await getQueue()
  if (queue.length === 0) return

  notify('syncing', queue.length)

  for (const payload of queue) {
    try {
      const res = await fetch('/api/sync-passadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok || res.status === 409) {
        // 200 = sincronizado; 409 = já processado (idempotente)
        await removeFromQueue(payload.uuid_local)
      } else if (res.status >= 400 && res.status < 500) {
        // Erros permanentes (400, 401, 403, 422): dados inválidos ou sem permissão
        // Não faz sentido retentar — remove da fila para não travar o sync
        console.error(`Sync permanente falhou (${res.status}) para ${payload.uuid_local} — removendo da fila`)
        await removeFromQueue(payload.uuid_local)
      }
      // 5xx e erros de rede: mantém na fila para retry posterior
    } catch {
      // Falha de rede — mantém na fila
    }
  }

  const remaining = await getQueue()
  notify(remaining.length === 0 ? 'idle' : 'error', remaining.length)
}
