/**
 * Mock Supabase client for server-side use when NEXT_PUBLIC_MOCK=true.
 * Query builder completo com suporte a chainable thenable.
 */
import {
  mockEventos, mockModalidades, mockSenhas, mockCompetidores, mockFila,
  mockRanking, mockEquipe, mockTransacoes, mockCobrancas, mockNotificacoes,
  mockCriterios, mockPassadasConflitos, mockTenant,
} from '@/lib/mock/data'

function mockFrom(table: string) {
  const allData: Record<string, any[]> = {
    eventos: mockEventos as any[],
    modalidades: mockModalidades as any[],
    senhas: mockSenhas as any[],
    competidores: mockCompetidores as any[],
    fila_entrada: mockFila as any[],
    ranking: mockRanking as any[],
    tenant_users: mockEquipe as any[],
    transacoes: mockTransacoes as any[],
    // Alias usado por algumas páginas (dashboard, financeiro)
    financeiro_transacoes: mockTransacoes as any[],
    cobrancas: mockCobrancas as any[],
    notificacoes: mockNotificacoes as any[],
    criterios_pontuacao: mockCriterios as any[],
    passadas_conflitos: mockPassadasConflitos as any[],
    tenants: [mockTenant] as any[],
    passadas: [] as any[],
    modalidade_criterios: [] as any[],
  }

  const rows = allData[table] ?? []

  function buildQuery<T = any>(filtered: T[], opts?: { count?: 'exact' | 'planned' | 'estimated' }) {
    const query: any = {
      eq(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] === value), opts)
      },
      neq(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] !== value), opts)
      },
      in(field: string, values: any[]) {
        return buildQuery(filtered.filter((r: any) => values.includes(r[field])), opts)
      },
      gt(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] > value), opts)
      },
      gte(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] >= value), opts)
      },
      lt(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] < value), opts)
      },
      lte(field: string, value: any) {
        return buildQuery(filtered.filter((r: any) => r[field] <= value), opts)
      },
      ilike(field: string, pattern: string) {
        const regex = new RegExp('^' + pattern.replace(/%/g, '.*').toLowerCase() + '$')
        return buildQuery(filtered.filter((r: any) => regex.test(String(r[field] ?? '').toLowerCase())), opts)
      },
      is(field: string, value: any) {
        if (value === null) return buildQuery(filtered.filter((r: any) => r[field] == null), opts)
        return buildQuery(filtered.filter((r: any) => r[field] === value), opts)
      },
      not(field: string, op: string, value: any) {
        if (op === 'is') {
          if (value === null) return buildQuery(filtered.filter((r: any) => r[field] != null), opts)
        }
        return buildQuery(filtered.filter((r: any) => r[field] !== value), opts)
      },
      or(filters: string) {
        // Suporta formato: `nome.ilike.%term%,cpf.ilike.%term%`
        const conditions = filters.split(',').map(f => f.trim())
        const result = filtered.filter((r: any) => {
          return conditions.some(cond => {
            const match = cond.match(/^(\w+)\.(\w+)\.(.+)$/)
            if (!match) return false
            const [, field, op, val] = match
            if (op === 'ilike') {
              const regex = new RegExp('^' + val.replace(/%/g, '.*').toLowerCase() + '$')
              return regex.test(String(r[field] ?? '').toLowerCase())
            }
            return false
          })
        })
        return buildQuery(result, opts)
      },
      order(field: string, orderOpts?: { ascending?: boolean; nullsFirst?: boolean }) {
        const sorted = [...filtered].sort((a: any, b: any) => {
          const valA = a[field] ?? ''
          const valB = b[field] ?? ''
          const cmp = typeof valA === 'string' ? valA.localeCompare(valB)
            : typeof valA === 'number' ? valA - valB
            : String(valA).localeCompare(String(valB))
          return orderOpts?.ascending === false ? -cmp : cmp
        })
        return buildQuery(sorted, opts)
      },
      limit(n: number) {
        return buildQuery(filtered.slice(0, n), opts)
      },
      range(from: number, to: number) {
        return buildQuery(filtered.slice(from, to + 1), opts)
      },
      single() {
        if (filtered.length === 0) return { data: null, error: { message: 'Not found' } as any }
        return { data: filtered[0], error: null }
      },
      maybeSingle() {
        return { data: filtered[0] ?? null, error: null }
      },
      textSearch() {
        return query
      },
      then(resolve?: (value: { data: T[]; error: null; count: number | null }) => any) {
        const count = opts?.count ? filtered.length : null
        const result = { data: filtered, error: null, count }
        return resolve ? Promise.resolve(resolve(result)) : Promise.resolve(result)
      },
      // Tornar thenable para await funcionar
      _filtered: filtered,
      _opts: opts,
    }
    // Marcar como thenable para compatibilidade com await
    ;(query as any)[Symbol.toStringTag] = 'Promise'
    return query
  }

  const query = buildQuery(rows)

  return {
    select(columns?: string) {
      let result = query
      // Se houver selects com sub-relacionamentos, apenas retorna os dados
      if (columns && columns.includes(',')) {
        // Simplesmente retorna com os dados atuais — mock não filtra colunas
      }
      return result
    },
    insert(values: any, opts?: any) {
      const inserted = Array.isArray(values) ? values : [values]
      // Adiciona ao armazenamento global se possível
      if (table && (globalThis as any).__sgvaq_mock_state?.[table]) {
        ;(globalThis as any).__sgvaq_mock_state[table].push(...inserted)
      }
      const result = {
        data: inserted.length === 1 ? inserted[0] : inserted,
        error: null,
        select() { return this as any },
        single() { return { data: inserted.length === 1 ? inserted[0] : inserted, error: null } },
        then(resolve?: any) {
          const r = { data: inserted, error: null, count: null }
          return resolve ? Promise.resolve(resolve(r)) : Promise.resolve(r)
        },
      }
      ;(result as any)[Symbol.toStringTag] = 'Promise'
      return result
    },
    update(values: any) {
      const result = {
        data: values,
        error: null,
        eq() { return result },
        neq() { return result },
        is() { return result },
        not() { return result },
        in() { return result },
        select() { return result },
        single() { return { data: values, error: null } },
        then(resolve?: any) {
          const r = { data: [values], error: null, count: null }
          return resolve ? Promise.resolve(resolve(r)) : Promise.resolve(r)
        },
      }
      ;(result as any)[Symbol.toStringTag] = 'Promise'
      return result
    },
    delete() {
      const result = {
        eq() { return result },
        neq() { return result },
        is() { return result },
        not() { return result },
        in() { return result },
        then(resolve?: any) {
          const r = { data: [], error: null, count: 0 }
          return resolve ? Promise.resolve(resolve(r)) : Promise.resolve(r)
        },
      }
      ;(result as any)[Symbol.toStringTag] = 'Promise'
      return result
    },
    upsert(values: any, opts?: any) {
      return this.insert(values, opts)
    },
  }
}

export function createMockServerClient() {
  return {
    from: mockFrom,
    rpc: (fn: string, args?: any) => ({
      then(resolve?: any) {
        if (fn === 'criar_senha_atomica') {
          const result = { data: { senha_id: `mock-senha-${Date.now()}` }, error: null }
          return resolve ? Promise.resolve(resolve(result)) : Promise.resolve(result)
        }
        const result = { data: null, error: null }
        return resolve ? Promise.resolve(resolve(result)) : Promise.resolve(result)
      },
      single() { return { data: null, error: null } },
    }),
    auth: {
      getUser: async (token?: string) => ({
        data: {
          user: {
            id: 'mock-user-1',
            email: 'admin@vaquejada.com',
            app_metadata: { role: 'organizador', tenant_id: 'mock-tenant-1' },
            user_metadata: {},
          }
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'mock-user-1', email: 'admin@vaquejada.com' },
          }
        },
        error: null,
      }),
      signInWithPassword: async () => ({
        data: {
          user: { id: 'mock-user-1', email: 'admin@vaquejada.com' },
          session: { access_token: 'mock-token', user: { id: 'mock-user-1' } },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock/path' }, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: '/mock/file.pdf' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '/mock/file.pdf' } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    channel: (name: string) => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
    removeAllChannels: () => {},
  }
}