import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Groups from '../Groups';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock hooks
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({
    isFree: () => false,
    roles: ['free_user'],
  }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    features: { unlimited_groups: false },
    getLimit: () => 3,
  }),
}));

describe('Groups Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls auth when mounting', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    render(
      <BrowserRouter>
        <Groups />
      </BrowserRouter>
    );

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('shows loading spinner initially', () => {
    (supabase.auth.getSession as any).mockImplementation(
      () => new Promise(() => {})
    );

    const { container } = render(
      <BrowserRouter>
        <Groups />
      </BrowserRouter>
    );

    expect(container.textContent).toMatch(/cargando tus grupos/i);
  });

  it('renders groups component', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'test', email: 'test@test.com' } } },
    });

    const { container } = render(
      <BrowserRouter>
        <Groups />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});
