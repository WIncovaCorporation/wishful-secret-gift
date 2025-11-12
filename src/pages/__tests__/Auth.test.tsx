import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../Auth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    const { container } = render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    expect(container.textContent).toMatch(/iniciar sesión/i);
    expect(container.querySelector('input[type="email"]')).toBeTruthy();
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('displays email input field', () => {
    const { container } = render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const emailInput = container.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();
  });

  it('displays password input field', () => {
    const { container } = render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).toBeTruthy();
  });
});
