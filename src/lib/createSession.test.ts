import { createSession } from './mutations';
import { supabase } from './supabaseClient';

jest.mock('./supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('createSession session code generator', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('generates 3 numbers, 3 letters and 1 special and retries on collision', async () => {
  const fromMock = (supabase as unknown as { from: jest.Mock }).from;

    // First existence check: collision
    const maybeSingleCollision = jest.fn().mockResolvedValue({ data: { session_id: 'existing' }, error: null });
    const selectExistCollision = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCollision });

    // Second existence check: unique
    const maybeSingleUnique = jest.fn().mockResolvedValue({ data: null, error: null });
    const selectExistUnique = jest.fn().mockReturnValue({ maybeSingle: maybeSingleUnique });

    // Insert call returns created session
    const singleInsert = jest.fn().mockResolvedValue({ data: { session_id: 'new-id', session_code: 'A1B2C3!' }, error: null });
    const insertSelect = jest.fn().mockReturnValue({ single: singleInsert });
    const insertMock = jest.fn().mockReturnValue({ select: insertSelect });

    fromMock
      .mockReturnValueOnce({ select: selectExistCollision })
      .mockReturnValueOnce({ select: selectExistUnique })
      .mockReturnValueOnce({ insert: insertMock });

    const result = await createSession('plaintext-pass', 'Host');

    expect(result.sessionCode).toHaveLength(7);

    const digits = result.sessionCode.replace(/[^0-9]/g, '');
    const letters = result.sessionCode.replace(/[^A-Za-z]/g, '');
    const specials = result.sessionCode.replace(/[A-Za-z0-9]/g, '');

    expect(digits.length).toBe(3);
    expect(letters.length).toBe(3);
    expect(specials.length).toBe(1);
  });
});
