jest.mock('next/server', () => ({
  NextResponse: { json: jest.fn() },
  NextRequest: jest.fn(),
}));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock('@/lib/supabase-service', () => ({ createSupabaseServiceClient: jest.fn() }));

import { mapCompleteError } from './route';

describe('mapCompleteError', () => {
  it('returns 401 for unauthorized', () => {
    const r = mapCompleteError('unauthorized');
    expect(r.status).toBe(401);
  });
  it('returns 400 for invalid_body', () => {
    const r = mapCompleteError('invalid_body');
    expect(r.status).toBe(400);
  });
  it('returns 500 for unexpected errors', () => {
    const r = mapCompleteError('some_db_error');
    expect(r.status).toBe(500);
  });
});
