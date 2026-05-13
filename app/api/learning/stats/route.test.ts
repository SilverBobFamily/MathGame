jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { mapLearningError, validateLearningBody } from './route';

describe('mapLearningError', () => {
  it('returns 401 for unauthorized', () => {
    expect(mapLearningError('unauthorized').status).toBe(401);
  });
  it('returns 400 for invalid_body', () => {
    expect(mapLearningError('invalid_body').status).toBe(400);
  });
  it('returns 500 for unknown error', () => {
    expect(mapLearningError('boom').status).toBe(500);
  });
});

describe('validateLearningBody', () => {
  const valid = {
    totalAttempted: 10, totalCorrect: 7,
    itemAttempted: 5,   itemCorrect: 4,
    actionAttempted: 5, actionCorrect: 3,
  };

  it('returns null for a valid body', () => {
    expect(validateLearningBody(valid)).toBeNull();
  });
  it('returns invalid_body when a field is missing', () => {
    const { totalAttempted: _, ...rest } = valid;
    expect(validateLearningBody(rest)).toBe('invalid_body');
  });
  it('returns invalid_body when a value is negative', () => {
    expect(validateLearningBody({ ...valid, totalCorrect: -1 })).toBe('invalid_body');
  });
  it('returns invalid_body when correct exceeds attempted', () => {
    expect(validateLearningBody({ ...valid, itemCorrect: 6 })).toBe('invalid_body');
  });
  it('returns invalid_body when a field is not an integer', () => {
    expect(validateLearningBody({ ...valid, totalAttempted: 1.5 })).toBe('invalid_body');
  });
});
