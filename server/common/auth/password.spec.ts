import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('hashes and verifies a password without storing plaintext', async () => {
    const password = 'Correct-Horse-42';
    const encoded = await hashPassword(password);
    expect(encoded).toMatch(/^scrypt\$[^$]+\$[0-9a-f]+$/);
    expect(encoded).not.toContain(password);
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', encoded)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('secret', 'invalid')).resolves.toBe(false);
  });
});
