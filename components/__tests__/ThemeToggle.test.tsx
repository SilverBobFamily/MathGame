import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

jest.mock('@/hooks/useTheme');
import { useTheme } from '@/hooks/useTheme';

describe('ThemeToggle', () => {
  it('shows aria-label "Switch to light mode" when theme is dark', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggle: jest.fn() });
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('shows aria-label "Switch to dark mode" when theme is light', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggle: jest.fn() });
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('calls toggle when clicked', () => {
    const toggle = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggle });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});
