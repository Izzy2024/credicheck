import { defaultSeedUsers } from '../src/config/default-users';

describe('Default admin seed', () => {
  it('promotes irios@gmail.com to admin', () => {
    const user = defaultSeedUsers.find((entry) => entry.email === 'irios@gmail.com');

    expect(user).toBeDefined();
    expect(user?.role).toBe('ADMIN');
  });
});
