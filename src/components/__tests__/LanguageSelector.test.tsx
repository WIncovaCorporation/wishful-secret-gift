import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import LanguageSelector from '../LanguageSelector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

describe('LanguageSelector', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders language selector button', () => {
    const { container } = renderWithProviders(<LanguageSelector />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('shows current language', () => {
    const { container } = renderWithProviders(<LanguageSelector />);
    // The component should show "EN" for English
    expect(container.textContent).toContain('EN');
  });

  it('component renders without crashing', () => {
    const { container } = renderWithProviders(<LanguageSelector />);
    expect(container).toBeTruthy();
  });
});
