import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound';

describe('NotFound Page', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders 404 message', () => {
    const { container } = renderWithRouter(<NotFound />);
    expect(container.textContent).toContain('404');
  });

  it('renders page not found message', () => {
    const { container } = renderWithRouter(<NotFound />);
    expect(container.textContent).toMatch(/Página no encontrada/i);
  });

  it('renders home link', () => {
    const { container } = renderWithRouter(<NotFound />);
    const homeLink = container.querySelector('a[href="/"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink?.textContent).toContain('Volver al inicio');
  });

  it('component renders without errors', () => {
    const { container } = renderWithRouter(<NotFound />);
    expect(container).toBeTruthy();
  });
});
