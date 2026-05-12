/**
 * @jest-environment node
 */
import { mapTutorialError } from '../complete/route';

describe('mapTutorialError', () => {
  it('maps already_complete to 200 with already:true', () => {
    expect(mapTutorialError('already_complete')).toEqual({
      status: 200, body: { ok: true, already: true },
    });
  });

  it('maps unknown errors to 500', () => {
    const result = mapTutorialError('some_random_error');
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: 'Internal server error' });
  });
});
