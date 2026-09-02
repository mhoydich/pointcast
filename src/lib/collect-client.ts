export type KennelClaimResponse = {
  ok?: boolean;
  status?: string;
  reason?: string;
  heldUntilWallet?: boolean;
};

export async function claimKennelClubSitting(
  tokenId: number,
  fetcher: typeof fetch = fetch,
): Promise<KennelClaimResponse> {
  const response = await fetcher('/api/kennel-club/claim', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId }),
  });
  const result = await response.json() as KennelClaimResponse;
  if (!response.ok) {
    const error = new Error(result.reason || `claim-${response.status}`);
    Object.assign(error, { status: response.status, result });
    throw error;
  }
  return result;
}

