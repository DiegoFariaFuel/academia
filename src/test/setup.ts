import '@testing-library/jest-dom/vitest';
import '../i18n';
import { setAppLocale } from '../i18n';

setAppLocale('pt');
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ-test-key');
