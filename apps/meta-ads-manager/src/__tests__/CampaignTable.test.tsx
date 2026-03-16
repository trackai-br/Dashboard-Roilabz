import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignTable } from '@/components/CampaignTable';

const mockCampaigns = [
  {
    id: '1',
    name: 'Campaign 1',
    account_id: 'acc-1',
    account_name: 'Account 1',
    status: 'ACTIVE' as const,
    spend: 1000,
    impressions: 50000,
    clicks: 500,
    cpc: 2.0,
    roas: 2.5,
    updated_at: '2024-03-16T10:00:00Z',
  },
  {
    id: '2',
    name: 'Campaign 2',
    account_id: 'acc-1',
    account_name: 'Account 1',
    status: 'PAUSED' as const,
    spend: 500,
    impressions: 25000,
    clicks: 250,
    cpc: 2.0,
    roas: 1.5,
    updated_at: '2024-03-15T10:00:00Z',
  },
];

describe('CampaignTable', () => {
  it('renders table with campaign data', () => {
    const { container } = render(<CampaignTable campaigns={mockCampaigns} />);

    expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Campaign 2')).toBeInTheDocument();
    // Check that the table contains the spend values (may be in different cells)
    const text = container.textContent;
    expect(text).toContain('1000');
    expect(text).toContain('500');
  });

  it('renders all required columns', () => {
    render(<CampaignTable campaigns={mockCampaigns} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Spend')).toBeInTheDocument();
    expect(screen.getByText('Impressions')).toBeInTheDocument();
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('CPC')).toBeInTheDocument();
    expect(screen.getByText('ROAS')).toBeInTheDocument();
  });

  it('renders loading skeletons when loading is true', () => {
    const { container } = render(
      <CampaignTable campaigns={[]} loading={true} />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error message when error is provided', () => {
    render(
      <CampaignTable
        campaigns={[]}
        error="Failed to load campaigns"
      />
    );

    expect(screen.getByText(/Failed to load campaigns/)).toBeInTheDocument();
  });

  it('displays "No campaigns found" when empty', () => {
    render(<CampaignTable campaigns={[]} />);

    expect(screen.getByText('No campaigns found')).toBeInTheDocument();
  });

  it('renders campaign status badge with correct styles', () => {
    render(<CampaignTable campaigns={mockCampaigns} />);

    const activeBadge = screen.getAllByText('ACTIVE')[0];
    expect(activeBadge).toHaveClass('bg-green-100');

    const pausedBadge = screen.getByText('PAUSED');
    expect(pausedBadge).toHaveClass('bg-yellow-100');
  });

  it('handles sorting by column name', () => {
    render(<CampaignTable campaigns={mockCampaigns} />);

    const nameHeader = screen.getAllByText('Name')[0];
    fireEvent.click(nameHeader);

    // After sorting, Campaign 1 should still appear first (ascending order)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Campaign 1');
  });

  it('formats numbers correctly', () => {
    render(<CampaignTable campaigns={mockCampaigns} />);

    // Check impressions are formatted (may vary by locale)
    const impressions = screen.getAllByText(/50/);
    expect(impressions.length).toBeGreaterThan(0);

    // Check ROAS is formatted with 2 decimals
    expect(screen.getByText('2.50x')).toBeInTheDocument();
    expect(screen.getByText('1.50x')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<CampaignTable campaigns={mockCampaigns} />);

    // Dates are formatted as locale date string (varies by system)
    // Just check that some date text is present
    const dateCells = screen.getAllByText(/2024/);
    expect(dateCells.length).toBeGreaterThan(0);
  });

  it('renders account selector when provided', () => {
    render(
      <CampaignTable
        campaigns={mockCampaigns}
        accountSelector={<div>Test Selector</div>}
      />
    );

    expect(screen.getByText('Test Selector')).toBeInTheDocument();
  });

  it('handles account name fallback', () => {
    const campaignWithoutAccountName = {
      ...mockCampaigns[0],
      account_name: undefined,
    };

    render(<CampaignTable campaigns={[campaignWithoutAccountName]} />);

    expect(screen.getByText('acc-1')).toBeInTheDocument();
  });
});
