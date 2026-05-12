// Unit tests for the pack route error mapping helper.

function mapPackError(msg: string): { status: number; error: string } {
  if (msg === 'insufficient_coins') return { status: 402, error: 'Not enough coins.' };
  if (msg === 'no_unowned_cards')   return { status: 422, error: 'You already own all cards in this selection.' };
  return { status: 500, error: msg };
}

describe('mapPackError', () => {
  it('maps insufficient_coins to 402', () =>
    expect(mapPackError('insufficient_coins')).toEqual({ status: 402, error: 'Not enough coins.' }));
  it('maps no_unowned_cards to 422', () =>
    expect(mapPackError('no_unowned_cards')).toEqual({ status: 422, error: 'You already own all cards in this selection.' }));
  it('passes through unknown errors as 500', () =>
    expect(mapPackError('db_error')).toEqual({ status: 500, error: 'db_error' }));
});
