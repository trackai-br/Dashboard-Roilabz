import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
  }),
}));

// Mock useAuth — simulate authenticated user
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@test.com' },
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('DashboardLayout', () => {
  it('renders with children content', () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    renderWithProviders(
      <DashboardLayout title="Custom Title">
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('always applies dark mode (NEON system)', () => {
    const { container } = renderWithProviders(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkDiv = container.querySelector('.dark');
    expect(darkDiv).toBeInTheDocument();
  });

  it('renders Sidebar on desktop', () => {
    const { container } = renderWithProviders(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
  });

  it('renders main content area', () => {
    const { container } = renderWithProviders(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
