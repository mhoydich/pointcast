-- Communicator v1-b (docs/prd/communicator-v1.md 4.4): delivery bookkeeping on messages.
-- note: why a row ended where it did ('dry-run', 'sent', 'no-consent', 'no-channel', 'cap-host', 'cap-recipient', 'send-failed').
-- expires_at: when the single-use reply token stops working (sent_at + 72 hours).
-- Quiet-hours holds are NOT stored: a held message stays 'pending' and is re-evaluated on the next deliver pass.
ALTER TABLE communicator_messages ADD COLUMN note TEXT;
ALTER TABLE communicator_messages ADD COLUMN expires_at TEXT;
CREATE INDEX communicator_messages_sent ON communicator_messages(to_handle,sent_at);
