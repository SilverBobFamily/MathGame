jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { POST, mapLearningError, validateLearningBody } from './route';
import type { NextRequest } from 'next/server';

function mockReq(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

const validBody = {
  totalAttempted: 10, totalCorrect: 7,
  itemAttempted: 5,   itemCorrect: 4,
  actionAttempted: 5, actionCorrect: 3,
};

describe('POST /api/learning/stats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createSupabaseServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    await POST(mockReq(validBody));
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
      { status: 401 },
    );
  });

  it('returns 400 when body is missing fields', async () => {
    (createSupabaseServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    });
    await POST(mockReq({ totalAttempted: 1 }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid request body' }),
      { status: 400 },
    );
  });

  it('returns 400 when itemCorrect > itemAttempted', async () => {
    (createSupabaseServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    });
    await POST(mockReq({ ...validBody, itemCorrect: 6 }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid request body' }),
      { status: 400 },
    );
  });

  it('returns 400 when a field is negative', async () => {
    (createSupabaseServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    });
    await POST(mockReq({ ...validBody, totalCorrect: -1 }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid request body' }),
      { status: 400 },
    );
  });

  it('returns 200 { ok: true } on valid input', async () => {
    (createSupabaseServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      rpc: async () => ({ error: null }),
    });
    await POST(mockReq(validBody));
    expect(NextResponse.json).toHaveBeenCalledWith({ ok: true });
  });
});

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
