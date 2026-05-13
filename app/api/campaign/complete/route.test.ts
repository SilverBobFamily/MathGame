jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { mapCampaignError } from './route';

describe('mapCampaignError', () => {
  it('401 for unauthorized', () => expect(mapCampaignError('unauthorized').status).toBe(401));
  it('400 for invalid_body', () => expect(mapCampaignError('invalid_body').status).toBe(400));
  it('404 for chapter_not_found', () => expect(mapCampaignError('chapter_not_found').status).toBe(404));
  it('500 for unknown', () => expect(mapCampaignError('boom').status).toBe(500));
});
