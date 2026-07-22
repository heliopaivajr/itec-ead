import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Builder fluente — qualquer método retorna `this`, exceto os terminais
// que resolvem para { data: [], error: null, count: 0 }.
// Os testes individuais sobrescrevem via vi.fn().mockResolvedValue().
function makeQueryBuilder(resolved = { data: [] as unknown[], error: null as string | null, count: 0 }) {
  const promise = Promise.resolve(resolved);

  const builder: Record<string, unknown> = {};

  const chainable = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'not', 'or', 'lt', 'lte', 'gt', 'gte',
    'order', 'limit', 'range', 'filter', 'match',
  ];

  for (const m of chainable) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }

  // Terminais que resolvem a promise
  builder['single'] = vi.fn().mockResolvedValue({ data: null, error: null });

  // Faz o builder ser "thenable" (await builder)
  builder['then'] = (res: (v: unknown) => void, rej: (e: unknown) => void) =>
    promise.then(res, rej);
  builder['catch'] = (rej: (e: unknown) => void) => promise.catch(rej);

  return builder;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => makeQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession:             vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange:      vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut:                vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword:     vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth:        vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp:                 vi.fn().mockResolvedValue({ data: {}, error: null }),
      resetPasswordForEmail:  vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload:       vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url/file' } }),
      })),
    },
  },
}));
