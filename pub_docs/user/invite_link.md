Functional Requirements Document (FRD): Secure Invitation Link System

1. Introduction

This document outlines the requirements for implementing a secure, unique, and time-bound invitation link system for the application. The goal is to allow any user to generate an invitation that cryptographically proves the identity and creation time of the link when it is redeemed.

2. Terminology

Term

Description

Payload

The raw data encoded in the token (e.g., user ID, expiration time).

Secret Key

A private key, known only to the server, used to sign the token.

Token

The Base64Url-encoded string containing the Payload and the cryptographic Signature.

HMAC-SHA256

The cryptographic algorithm used to sign the token, ensuring integrity.

3. Link Generation Requirements (Server-Side)

FR-GEN-001: Link Generation Endpoint

The application SHALL provide a secure API endpoint (/api/generate-invite) that, when called by an authenticated user, generates a new unique invitation token.

FR-GEN-002: Token Payload Structure

The system SHALL construct the token payload with the following fields:

inviter_id: The ID of the user who generated the link.

created_at: The UTC timestamp of when the token was generated.

expires_at: The UTC timestamp defining the link's expiration (e.g., 7 days after creation).

token_uuid: A unique, non-guessable identifier (UUID) for this specific token instance, stored in the database for single-use tracking.

FR-GEN-003: Cryptographic Signing

The system SHALL use the HMAC-SHA256 algorithm and a server-side Secret Key (dummy key for initial implementation) to sign the Payload, creating a secure Signature.

FR-GEN-004: Token Format

The final invitation link SHALL be in the following format:
https://your-app.com/invite?token=[Base64Url(Payload + Signature)]

FR-GEN-005: Database Storage (Initial State)

Upon generation, the system SHALL store the token_uuid, inviter_id, expires_at, and a status of PENDING in a dedicated invitations database collection.

4. Link Redemption Requirements (Server-Side & Client-Side)

FR-RED-001: Link Access Handling (Client-Side)

When a user accesses the URL /invite?token=..., the client-side application SHALL extract the token parameter and submit it to the server's validation endpoint (/api/validate-invite).

FR-RED-002: Cryptographic Validation

The validation endpoint SHALL perform the following steps in sequence:

Decode: Decode the Base64Url token to retrieve the Payload and the Signature.

Verify Integrity: Re-calculate the HMAC-SHA256 signature using the retrieved Payload and the server's Secret Key.

Signature Match: Reject the request if the re-calculated signature DOES NOT match the Signature included in the token.

FR-RED-003: Expiration Check

The system SHALL check the expires_at timestamp from the Payload. Reject the request if the current time is after the expiration time.

FR-RED-004: Single-Use Check (Database Lookup)

The system SHALL look up the token_uuid in the database.

Reject the request if the token_uuid is not found (invalid or deleted).

Reject the request if the invitation status is anything other than PENDING (e.g., REDEEMED, CANCELLED).

FR-RED-005: Successful Validation Response

If all checks pass, the server SHALL update the invitation status in the database to REDEEMED and return a successful response (e.g., HTTP 200) to the client.

FR-RED-006: Client Redirection

Upon receiving a successful validation response, the client application SHALL redirect the user to the standard application login or registration page. If the link contained data about the invited user (e.g., email), this data should be pre-filled on the registration form.

5. Security Requirements

FR-SEC-001: Secret Key Rotation

The server Secret Key SHALL be stored as an environment variable and treated as a highly sensitive credential, with a plan for regular rotation.

FR-SEC-002: Sensitive Data Restriction

The URL parameter SHALL contain only the secure Token and NO sensitive, readable data (e.g., no raw email address, unencrypted user ID, or raw date).