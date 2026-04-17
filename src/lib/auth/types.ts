export type AuthProvider =
  | 'kukai'
  | 'google'
  | 'apple'
  | 'metamask'
  | 'phantom'
  | 'temple'
  | 'umami';

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
}

export interface AuthSession {
  userId: string;
  sessionToken: string;
  expiresAt: string;
}
