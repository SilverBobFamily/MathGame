import { render, screen, fireEvent } from '@testing-library/react';
import SoundToggle from '../SoundToggle';

jest.mock('@/hooks/useSoundEnabled');
import { useSoundEnabled } from '@/hooks/useSoundEnabled';

describe('SoundToggle', () => {
  it('shows aria-label "Disable sound effects" when sound is on', () => {
    (useSoundEnabled as jest.Mock).mockReturnValue({ enabled: true, toggle: jest.fn() });
    render(<SoundToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Disable sound effects');
  });

  it('shows aria-label "Enable sound effects" when sound is off', () => {
    (useSoundEnabled as jest.Mock).mockReturnValue({ enabled: false, toggle: jest.fn() });
    render(<SoundToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Enable sound effects');
  });

  it('calls toggle when clicked', () => {
    const toggle = jest.fn();
    (useSoundEnabled as jest.Mock).mockReturnValue({ enabled: true, toggle });
    render(<SoundToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});
