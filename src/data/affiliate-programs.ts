// Affiliate program registry — stage 1.
//
// Every row below is `approved: false`. commerce.ts will not resolve a paid
// link for any program until Mike applies, an approval lands, and this file
// is edited to say so (approved: true, an ISO approvedOn, and the real
// linkHosts the network's tracked links use). Until then every resolution
// PaidLink asks for comes back unpaid.
//
// This file has no imports on purpose: it is the one place stage 1 wants a
// human to read start to finish before touching approved.

export interface AffiliateProgram {
  id: string;
  brand: string;
  network: string;
  rate: string;
  cookie: string;
  accepting: boolean;
  approved: boolean;
  approvedOn: string | null;
  linkHosts: string[];
  applyOrder: number;
  status: string;
  source: string | null;
}

export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    id: 'selkirk',
    brand: 'Selkirk',
    network: 'AvantLink',
    rate: '15%, 30-day cookie',
    cookie: '30-day',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 1,
    status: 'Not applied.',
    source: null,
  },
  {
    id: 'engage',
    brand: 'Engage',
    network: 'Skimlinks or FlexOffers',
    rate: '10% (Skimlinks) or 8% (FlexOffers)',
    cookie: 'unknown',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 2,
    status: 'Not applied.',
    source: null,
  },
  {
    id: 'crbn',
    brand: 'CRBN',
    network: 'unknown',
    rate: 'not confirmed',
    cookie: 'unknown',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 3,
    status: 'Not applied.',
    source: null,
  },
  {
    id: 'six-zero',
    brand: '6/0 Six Zero',
    network: 'UpPromote',
    rate: 'not confirmed',
    cookie: 'unknown',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 4,
    status: 'Not applied.',
    source: null,
  },
  {
    id: '11six24',
    brand: '11SIX24',
    network: 'Ambassador program',
    rate: '$15 store credit or $10 cash per paddle ($10 credit / $5 cash on Jelly Bean paddles)',
    cookie: 'unknown',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 5,
    status: 'Not applied.',
    source: 'https://11six24.com/pages/ambassador-program',
  },
  {
    id: 'amazon',
    brand: 'Amazon',
    network: 'Amazon Associates',
    rate: 'about 3%, unverified',
    cookie: 'unknown',
    accepting: true,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 6,
    status: 'Not applied.',
    source: null,
  },
  {
    id: 'joola',
    brand: 'JOOLA',
    network: 'unknown',
    rate: 'unknown',
    cookie: 'unknown',
    accepting: false,
    approved: false,
    approvedOn: null,
    linkHosts: [],
    applyOrder: 7,
    status: 'Not accepting applications.',
    source: null,
  },
];
