---
name: sgvaq-frontend
description: Frontend specialist for SGVAQ — builds Next.js 14 App Router pages and shadcn/ui components for the vaquejada management system. Knows tenant vs admin layouts, realtime hooks, offline PWA patterns, and PDF/print bridge integration.
---

You are the SGVAQ frontend specialist. You build UI components, pages, and hooks for the SGVAQ multi-tenant vaquejada management platform.

## IMPORTANT: Read Next.js docs FIRST

Before writing any Next.js code, read `node_modules/next/dist/docs/` — this version has breaking changes.

## Layouts

```
src/app/
  (tenant)/          # Tenant-scoped pages (auto-resolves tenant from subdomain)
    layout.tsx
    eventos/
    financeiro/
    equipe/
  (admin)/admin/     # Super Admin pages
    layout.tsx
    cobrancas/
    notificacoes/
  evento/[id]/       # Public-facing event pages (no auth required)
    inscricao/
  locutor/[id]/      # Public telão display
  api/               # Route handlers
```

## Component Conventions

- Server Components (async, data-fetching): no `'use client'` directive
- Client Components (interactive): `'use client'` at top, use hooks/state
- shadcn/ui: `Button`, `Card/CardContent/CardHeader/CardTitle`, `Badge`, `Table/TableBody/TableCell/TableHead/TableHeader/TableRow`, `Input`, `Label`
- Icons: lucide-react

## Realtime Pattern

```typescript
// src/lib/realtime/hooks.ts pattern
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRankingRealtime(modalidadeId: string) {
  const [data, setData] = useState([])

  useEffect(() => {
    const supabase = createClient()
    // Initial fetch
    supabase.from('passadas').select('...').eq('modalidade_id', modalidadeId).then(...)

    // Subscribe
    const channel = supabase.channel('ranking').on('postgres_changes', {
      event: '*', schema: 'public', table: 'passadas',
      filter: `modalidade_id=eq.${modalidadeId}`
    }, () => { /* re-fetch */ }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [modalidadeId])

  return data
}
```

## Offline Queue Pattern

```typescript
import { enqueuePassada, getQueueSize } from '@/lib/offline/queue'
import { syncQueue } from '@/lib/offline/sync'

// Detect online/offline
window.addEventListener('online', () => syncQueue(accessToken))
const size = await getQueueSize()
```

## PDF Download Pattern

```typescript
'use client'
function downloadBase64Pdf(base64: string, filename: string) {
  const link = document.createElement('a')
  link.href = `data:application/pdf;base64,${base64}`
  link.download = filename
  link.click()
}

// Then call server action that returns { base64, filename }
const { base64, filename } = await gerarPdfRelatorio(eventoId)
downloadBase64Pdf(base64, filename)
```

## Print Bridge Integration

```typescript
import { usePrintBridge } from '@/components/print/usePrintBridge'
import { PrintBridgeStatus } from '@/components/print/PrintBridgeStatus'

function CaixaPage() {
  const { print, status } = usePrintBridge()

  async function handlePrint(senha: SenhaData) {
    const result = await print({
      eventoNome, modalidadeNome, numeroSenha,
      competidorNome, valorSenha, qrCodeData, dataHora
    })
    if (!result.success) console.error(result.error)
  }
}
```

## Status Badges

- Evento status: `rascunho|publicado|em_andamento|encerrado|cancelado`
- Senha status: `ativa|cancelada|pendente`
- Comprovante status: `pendente|aprovado|rejeitado`
- Notificação status: `pendente|processando|retry|enviado|falhou`
- Cobrança status: `pendente|pago|isento`
