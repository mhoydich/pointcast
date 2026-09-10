export interface AccountProvider {
  id: 'x' | 'google' | 'apple' | 'kukai' | 'metamask' | 'phantom';
  provider: string;
  kind: string;
  availability: 'available' | 'preview' | 'configuration-required';
  keeps: string[];
  availabilityEndpoint?: string;
}

export const ACCOUNT_PROVIDERS: AccountProvider[] = [
  {
    id: 'x',
    provider: 'X',
    kind: 'Account · sign-in only',
    availability: 'configuration-required',
    availabilityEndpoint: '/api/auth/x?status=1',
    keeps: ['verified X user ID', 'username', 'display name', 'profile image'],
  },
  {
    id: 'google',
    provider: 'Google',
    kind: 'Account',
    availability: 'available',
    keeps: ['verified email', 'display name', 'profile image'],
  },
  {
    id: 'kukai',
    provider: 'Kukai',
    kind: 'Tezos wallet',
    availability: 'available',
    keeps: ['public address', 'wallet-control proof'],
  },
  {
    id: 'metamask',
    provider: 'MetaMask',
    kind: 'Ethereum wallet',
    availability: 'preview',
    keeps: ['public address', 'wallet-control proof'],
  },
  {
    id: 'apple',
    provider: 'Apple',
    kind: 'Account',
    availability: 'preview',
    keeps: ['verified email', 'display name'],
  },
  {
    id: 'phantom',
    provider: 'Phantom',
    kind: 'Solana wallet',
    availability: 'preview',
    keeps: ['public address', 'wallet-control proof'],
  },
];
