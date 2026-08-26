export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}
