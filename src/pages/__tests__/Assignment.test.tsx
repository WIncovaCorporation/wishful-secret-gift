import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Assignment from '../Assignment';
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

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ groupId: 'test-group-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('Assignment Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls auth when mounting', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    render(
      <BrowserRouter>
        <Assignment />
      </BrowserRouter>
    );

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('shows loading state initially', () => {
    (supabase.auth.getSession as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(
      <BrowserRouter>
        <Assignment />
      </BrowserRouter>
    );

    expect(container.textContent).toMatch(/cargando/i);
  });
});
