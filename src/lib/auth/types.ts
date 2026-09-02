export type AuthProvider =
  | 'kukai'
  | 'google'
  | 'passkey'
  | 'email'
  | 'apple'
  | 'metamask'
  | 'phantom'
  | 'temple'
  | 'umami';

export type AuthRole = 'broadcaster';

export interface AuthIdentity {
  provider: AuthProvider;
  id: string;
  name: string;
  avatar?: string;
  verifiedAt: string;
}

export interface PointCastUser {
  userId: string;
  createdAt: string;
  identities: AuthIdentity[];
  preferredName: string;
  roles?: AuthRole[];
}

export interface AuthSession {
  userId: string;
  sessionToken: string;
  expiresAt: string;
}
