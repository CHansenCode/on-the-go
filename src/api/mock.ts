import { AuthUser, Session } from '../auth/types';

// Stand-ins for the two accounts main-frame will provision — this app is a
// two-person shared platform, not open signup, so there's no register flow
// to mock. Swap this whole module out once main-frame's real
// POST /auth/login endpoint exists (see src/api/client.ts).
const MOCK_USERS: AuthUser[] = [
  { id: '1', username: 'you', displayName: 'You' },
  { id: '2', username: 'partner', displayName: 'Partner' },
];

export async function mockLogin(
  username: string,
  password: string
): Promise<Session> {
  await delay(300); // pretend it's a network round trip

  if (!password) {
    throw new Error('Password is required');
  }

  const user = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user) {
    throw new Error('Unknown user');
  }

  return { token: `mock-token-${user.id}-${Date.now()}`, user };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
