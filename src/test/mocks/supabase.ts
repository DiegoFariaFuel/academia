import { vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

export const mockUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@test.com',
  app_metadata: {},
  user_metadata: { nome: 'Admin Test' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export const mockStaffUser: User = {
  ...mockUser,
  app_metadata: { role: 'staff' },
};

export const mockSession = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockStaffUser,
};

export function createSupabaseMock() {
  const unsubscribe = vi.fn();
  const onAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe } },
  }));

  return {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  };
}
