import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/KPICard';

describe('KPICard', () => {
  it('renders with correct title and value', () => {
    render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        unit="USD"
      />
    );

    expect(screen.getByText('Total Spend')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading is true', () => {
    const { container } = render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        loading={true}
      />
    );

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders trend percentage when provided', () => {
    render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        trend={15}
      />
    );

    expect(screen.getByText('+15% from last month')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        icon="💰"
      />
    );

    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <KPICard
        title="Test"
        value="100"
        className="custom-class"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders negative trend with danger color', () => {
    render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        trend={-10}
      />
    );

    const trendText = screen.getByText('-10% from last month');
    expect(trendText).toHaveStyle({ color: 'var(--color-danger)' });
  });

  it('renders positive trend with success color', () => {
    render(
      <KPICard
        title="Total Spend"
        value="$1,234.56"
        trend={10}
      />
    );

    const trendText = screen.getByText('+10% from last month');
    expect(trendText).toHaveStyle({ color: 'var(--color-success)' });
  });
});
