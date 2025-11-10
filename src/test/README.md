# Testing Guide - GiftApp MVP

## Overview

This project uses **Vitest** as the test runner with **React Testing Library** for component testing. Tests are configured to achieve minimum 60% code coverage for critical paths.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test src/pages/__tests__/NotFound.test.tsx

# Run tests matching pattern
npm test -- Auth

# Run tests with UI (Vitest UI)
npm run test:ui
```

---

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Global test setup and mocks
│   ├── testUtils.tsx      # Custom render with providers
│   └── README.md          # This file
├── components/
│   └── __tests__/         # Component tests
│       └── *.test.tsx
├── pages/
│   └── __tests__/         # Page component tests
│       └── *.test.tsx
├── hooks/
│   └── __tests__/         # Custom hooks tests
│       └── *.test.ts
└── lib/
    └── __tests__/         # Utility function tests
        └── *.test.ts
```

---

## Coverage Requirements

**Minimum Coverage Thresholds** (configured in `vitest.config.ts`):
- **Lines**: 60%
- **Functions**: 50%
- **Branches**: 50%
- **Statements**: 60%

**Critical Paths** (must have tests):
- ✅ Authentication flows (signup, login, logout)
- ✅ CRUD operations (lists, groups, events)
- ✅ Data validation and error handling
- ✅ Navigation and routing
- ✅ User interactions (buttons, forms)

---

## Writing Tests

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeTruthy();
  });

  it('displays correct text', () => {
    const { container } = render(<MyComponent />);
    expect(container.textContent).toContain('Expected Text');
  });
});
```

### Hook Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });
});
```

### Utility Function Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from '../myUtility';

describe('myUtility', () => {
  it('transforms input correctly', () => {
    const result = myUtility('input');
    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myUtility('')).toBe('');
    expect(myUtility(null)).toBe(null);
  });
});
```

---

## Testing Best Practices

### ✅ DO

- ✅ Test user-facing behavior, not implementation details
- ✅ Use descriptive test names: `it('should redirect to login after logout')`
- ✅ Keep tests simple and focused (one assertion per test ideally)
- ✅ Mock external dependencies (Supabase, APIs)
- ✅ Test error states and edge cases
- ✅ Use `data-testid` for complex queries when necessary
- ✅ Test accessibility (ARIA attributes, keyboard navigation)

### ❌ DON'T

- ❌ Test implementation details (internal state, private methods)
- ❌ Write tests that depend on execution order
- ❌ Use `setTimeout` or arbitrary waits (use `waitFor` instead)
- ❌ Test third-party libraries (trust they work)
- ❌ Snapshot test everything (only for stable, well-structured components)
- ❌ Skip tests with `.skip()` without documentation
- ❌ Mock everything (prefer integration tests when possible)

---

## Mocking

### Mocking Supabase

```typescript
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    auth: {
      signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));
```

### Mocking Context

```typescript
vi.mock('@/contexts/MyContext', () => ({
  useMyContext: () => ({
    value: 'mocked value',
    setValue: vi.fn(),
  }),
}));
```

### Mocking Router

```typescript
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};
```

---

## Global Test Setup

**File:** `src/test/setup.ts`

Pre-configured mocks:
- ✅ `window.matchMedia` (for responsive tests)
- ✅ `IntersectionObserver` (for lazy loading)
- ✅ `jest-dom` matchers (extended expect assertions)

Automatic cleanup after each test via `@testing-library/react/cleanup`.

---

## Custom Test Utils

**File:** `src/test/testUtils.tsx`

Provides `render()` function with all providers pre-configured:
- QueryClientProvider (React Query)
- BrowserRouter (React Router)
- ThemeProvider (Dark/Light mode)

**Usage:**
```typescript
import { render } from '@/test/testUtils';
// Automatically includes all providers
render(<MyComponent />);
```

---

## Coverage Reports

Coverage reports are generated in `coverage/` directory:

```
coverage/
├── index.html          # HTML report (open in browser)
├── lcov-report/        # LCOV format
├── coverage-final.json # JSON format
└── clover.xml          # Clover format (for CI/CD)
```

**View HTML Report:**
```bash
npm test -- --coverage
open coverage/index.html
```

---

## Continuous Integration

Tests run automatically on:
- ✅ Every push to `main` branch
- ✅ Every pull request
- ✅ Before deployment

**CI Workflow** (`.github/workflows/test.yml`):
```yaml
- name: Run tests
  run: npm test -- --coverage --reporter=verbose

- name: Check coverage thresholds
  run: npm test -- --coverage --reporter=json
```

---

## Debugging Tests

### VSCode Debugging

1. Add breakpoint in test file
2. Run: "Debug: JavaScript Debug Terminal"
3. Execute: `npm test -- --no-coverage MyTest.test.tsx`

### Console Logging

```typescript
import { screen, debug } from '@testing-library/react';

it('test', () => {
  const { container } = render(<MyComponent />);
  
  // Print DOM tree
  debug(container);
  
  // Print specific element
  const element = container.querySelector('.my-class');
  console.log(element?.outerHTML);
});
```

### Vitest UI

```bash
npm run test:ui
# Opens browser UI at http://localhost:51204/__vitest__/
```

Shows:
- Test status (pass/fail)
- Execution time
- Coverage visualization
- Test snapshots

---

## FAQ

### Q: Tests are slow. How can I speed them up?

**A:** 
- Run tests in parallel (default)
- Use `--no-coverage` during development
- Mock heavy dependencies (Supabase, APIs)
- Use `it.skip()` or `describe.only()` to focus on specific tests

### Q: How do I test async code?

**A:** Use `waitFor` or `findBy*` queries:

```typescript
import { waitFor } from '@testing-library/react';

it('loads data', async () => {
  render(<MyComponent />);
  
  // Wait for element to appear
  await waitFor(() => {
    expect(container.textContent).toContain('Loaded Data');
  });
});
```

### Q: How do I test protected routes?

**A:** Mock authentication state:

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: '123' } } },
      }),
    },
  },
}));
```

### Q: Can I use Playwright for E2E tests?

**A:** Yes! Vitest is for unit/integration tests. Add Playwright for E2E:

```bash
npm install -D @playwright/test
npx playwright install
```

Create `e2e/` directory for E2E tests.

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)

---

## Current Test Status

**Files with Tests:**
- ✅ `src/pages/__tests__/NotFound.test.tsx` (4 tests)
- ✅ `src/components/__tests__/LanguageSelector.test.tsx` (3 tests)

**TODO - High Priority:**
- [ ] Auth page tests (signup, login, logout)
- [ ] Dashboard tests (navigation, onboarding)
- [ ] Lists CRUD tests
- [ ] Groups CRUD tests
- [ ] Events CRUD tests
- [ ] Error boundary tests
- [ ] Edge function integration tests

**Target Coverage:** 60% (currently: ~15%)  
**Estimated Work:** 4-6 hours to reach target

---

**Last Updated:** 2025-11-10  
**Version:** 1.0.0
