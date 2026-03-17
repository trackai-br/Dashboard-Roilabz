import React from 'react';
import { render, screen } from '@testing-library/react';
import GoogleAuthButton from './GoogleAuthButton';

jest.mock('@supabase/supabase-js');

describe('GoogleAuthButton', () => {
  test('renders login button', () => {
    render(<GoogleAuthButton />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  test('button has correct styling when not loading', () => {
    render(<GoogleAuthButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  test('button is disabled when loading', () => {
    render(<GoogleAuthButton isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('shows loading text when loading', () => {
    render(<GoogleAuthButton isLoading={true} />);
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
