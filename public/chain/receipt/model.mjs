// Interpret a node response without treating an observation as independent proof.
export function receiptView(hash, value, tip) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Enter a 64-character hexadecimal transaction hash.');
  if (value === null || (value && value.status === 'unknown')) return { state: 'not-found', title: 'Not found', detail: 'This node has no record of that hash. It may be wrong, unavailable, or from an earlier reset.' };
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The node returned an unreadable transaction response.');
  if (value.status === 'pending') return { state: 'pending', title: 'Pending', detail: 'The node has received this transaction, but has not reported it in a block.' };
  if (value.status === 'rejected') return { state: 'rejected', title: 'Rejected', detail: 'The node reports this transaction was rejected.', reason: typeof value.reason === 'string' ? value.reason : (typeof value.error === 'string' ? value.error : '') };
  if (value.status === 'included') {
    const r = value.receipt;
    if (!Number.isSafeInteger(value.height) || value.height < 0 || !r || typeof r !== 'object' || r.tx_hash !== hash || !Number.isSafeInteger(tip) || tip < value.height) throw new Error('The node returned an inconsistent inclusion receipt. Try again.');
    return { state: 'included', title: 'Included in a block', detail: 'The node reports this receipt. This is not an independently verified proof or a guarantee of finality.', height: value.height, since: tip - value.height, kind: r.kind, sender: r.sender };
  }
  throw new Error('The node returned an unknown transaction status.');
}
