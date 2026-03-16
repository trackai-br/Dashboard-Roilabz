import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardLayout } from '@/components/DashboardLayout';

describe('DashboardLayout', () => {
  it('renders header with title', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Meta Ads Manager')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Creatives')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has dark mode button', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkModeButton = screen.getByLabelText('Toggle dark mode');
    expect(darkModeButton).toBeInTheDocument();
  });

  it('calls onDarkModeToggle when dark mode button is clicked', () => {
    const mockToggle = jest.fn();
    render(
      <DashboardLayout darkMode={false} onDarkModeToggle={mockToggle}>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkModeButton = screen.getByLabelText('Toggle dark mode');
    fireEvent.click(darkModeButton);

    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('displays correct dark mode icon based on darkMode prop', () => {
    const { rerender } = render(
      <DashboardLayout darkMode={false}>
        <div>Test Content</div>
      </DashboardLayout>
    );

    let darkModeButton = screen.getByLabelText('Toggle dark mode');
    expect(darkModeButton).toHaveTextContent('🌙');

    rerender(
      <DashboardLayout darkMode={true}>
        <div>Test Content</div>
      </DashboardLayout>
    );

    darkModeButton = screen.getByLabelText('Toggle dark mode');
    expect(darkModeButton).toHaveTextContent('☀️');
  });

  it('has notifications button', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const notificationsButton = screen.getByLabelText('Notifications');
    expect(notificationsButton).toBeInTheDocument();
  });

  it('has user menu button', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const userMenuButton = screen.getByLabelText('User menu');
    expect(userMenuButton).toBeInTheDocument();
  });

  it('toggles sidebar on mobile', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const sidebarToggleButton = screen.getByRole('button', { name: /Open sidebar/i });

    // Initially sidebar should be closed (hidden)
    let sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Click to open
    fireEvent.click(sidebarToggleButton);
    sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('translate-x-0');

    // Click to close
    fireEvent.click(sidebarToggleButton);
    sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('closes sidebar when clicking overlay', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const sidebarToggleButton = screen.getByRole('button', { name: /Open sidebar/i });
    fireEvent.click(sidebarToggleButton);

    const overlay = container.querySelector('[class*="bg-black"]');
    if (overlay) {
      fireEvent.click(overlay);
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('-translate-x-full');
    }
  });

  it('applies dark class when darkMode is true', () => {
    const { container } = render(
      <DashboardLayout darkMode={true}>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkDiv = container.querySelector('.dark');
    expect(darkDiv).toBeInTheDocument();
  });

  it('does not apply dark class when darkMode is false', () => {
    const { container } = render(
      <DashboardLayout darkMode={false}>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const darkDiv = container.querySelector('.dark');
    expect(darkDiv).not.toBeInTheDocument();
  });
});
