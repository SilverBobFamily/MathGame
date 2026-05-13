jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { mapSubmitError } from './route';

describe('mapSubmitError', () => {
  it('401 for unauthorized', () => expect(mapSubmitError('unauthorized').status).toBe(401));
  it('400 for invalid_body', () => expect(mapSubmitError('invalid_body').status).toBe(400));
  it('200 for already_attempted', () => expect(mapSubmitError('already_attempted').status).toBe(200));
  it('500 for unknown', () => expect(mapSubmitError('boom').status).toBe(500));
});
