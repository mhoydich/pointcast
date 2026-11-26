#!/usr/bin/env bash
# Signing-desk handoff only. Written for OFF-53; NOT run by Ada.
# Run once per reviewed contract. Compile DAO only after Seat's address is known.
set -euo pipefail
if [[ $# != 4 ]]; then
  echo 'Usage: originate.sh ALIAS CODE.tz STORAGE.tz --dry-run|--execute' >&2
  exit 2
fi
: "${UFOGP_RPC:?Explicit Tezos RPC required}"
: "${UFOGP_SIGNER:?Existing octez signer alias required; never pass a key}"
: "${UFOGP_BURN_CAP:?Explicit approved maximum storage burn in tez required}"
[[ -f "$2" && -f "$3" ]] || exit 2
mode="$4"
extra=()
case "$mode" in
  --dry-run) extra+=(--dry-run) ;;
  --execute)
    [[ "${UFOGP_SIGNING_DESK_APPROVAL:-}" == 'approved-in-signing-desk-chat' ]] || {
      echo 'Needs Mike’s amount-specific yes in the Signing desk chat. A board post does not count.' >&2
      exit 2
    } ;;
  *) exit 2 ;;
esac
# Zero initial balance. Burn cap excludes operation fees; review the total first.
octez-client --endpoint "$UFOGP_RPC" originate contract "$1" transferring 0 \
  from "$UFOGP_SIGNER" running "$2" --init "$(cat "$3")" \
  --burn-cap "$UFOGP_BURN_CAP" "${extra[@]}"
