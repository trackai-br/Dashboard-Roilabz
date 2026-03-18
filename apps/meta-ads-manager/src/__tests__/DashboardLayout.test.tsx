import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '@/components/DashboardLayout';

describe('DashboardLayout', () => {
  it('renders with children content', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <DashboardLayout title="Custom Title">
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('always applies dark mode (NEON system)', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkDiv = container.querySelector('.dark');
    expect(darkDiv).toBeInTheDocument();
  });

  it('renders Sidebar on desktop', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
  });

  it('renders main content area', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
