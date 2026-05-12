// components/__tests__/DeckBuilder.test.tsx
import { render, screen } from '@testing-library/react';
import DeckBuilder from '../DeckBuilder';

jest.mock('@/lib/supabase-browser', () => ({
  createSupabaseBrowserClient: () => ({
    from: () => ({ select: () => ({ data: [], error: null }) }),
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
  }),
}));

jest.mock('@/lib/supabase', () => ({
  fetchReleases: async () => [],
  fetchCardsByReleaseIds: async () => [],
  fetchOwnedCardIds: async () => new Set<number>(),
}));

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

describe('DeckBuilder', () => {
  it('renders without crashing', () => {
    render(<DeckBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText('Deck name…')).toBeInTheDocument();
  });
});
