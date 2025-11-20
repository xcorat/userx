### Ed25519 Credentials Tester

This directory contains the Svelte test page `/tests/credentials` that helps developers exercise the full Ed25519 public/private key authentication flow.

How to use:
- Start the dev server: `pnpm dev`.
- Navigate to `/tests/credentials`.
- Use the **Generate Keypair** flow to create a new Ed25519 keypair and encrypt the private key with a password.
- Use **Decrypt Private Key** to decrypt an encrypted private key (the test DB includes seeded users whose encrypted private keys are present).
- The decrypted private key field is editable — you can paste or change the private key manually before validation.
- Use **Validate Private Key** to sign a short challenge and verify the signature against the current public key.
- Use **Sign Challenge** to create a signature and **Verify Signature** using the public key.

Security notes:
- Private keys must never be uploaded to production or real user data stores. The credentials tester exposes and allows editing private keys for testing only in local/test environments.
- Seeded users in the test DB (if present) use the test password `password`.

If you want to add more seeded test users, update the seed scripts under `scripts/d1-seed.sql` and `scripts/generate-keypairs.mjs`.
