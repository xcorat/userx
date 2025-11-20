#!/usr/bin/env node
/*
 Node script to decrypt encryptedPrivateKey (PBKDF2 + AES-GCM) and sign a challenge using Ed25519
 Usage:
   node scripts/sign-challenge.mjs <encryptedPrivateKeyBase64> <password> <challenge>

 Example flow using curl:
 1) STEP1: fetch challenge
 curl -X POST -H "Content-Type: application/json" -d '{"username":"alicejohnson"}' http://localhost:5173/api/auth/login-step1
  -> returns { publicKey, encryptedPrivateKey, challenge }
 2) Use this script to sign challenge
 node scripts/sign-challenge.mjs '<encryptedPrivateKey>' 'password' '<challenge>'
  -> returns base64 signature
 3) STEP2: send signature
 curl -X POST -H "Content-Type: application/json" -d '{"publicKey":"<publicKey>","challenge":"<challenge>","signature":"<signature>"}' http://localhost:5173/api/auth/login-step2
*/

import { Buffer } from 'buffer';

if (process.argv.length < 5) {
  console.error('Usage: node scripts/sign-challenge.mjs <encryptedPrivateKey> <password> <challenge>');
  process.exit(1);
}

const encryptedBlobBase64 = process.argv[2];
const password = process.argv[3];
const challenge = process.argv[4];

// Constants: must match client-side constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256; // bits

function base64ToUint8Array(base64) {
  const buf = Buffer.from(base64, 'base64');
  return new Uint8Array(buf);
}

function uint8ArrayToArrayBuffer(u8) {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

(async () => {
  try {
    const blob = base64ToUint8Array(encryptedBlobBase64);
    const salt = blob.slice(0, SALT_LENGTH);
    const iv = blob.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = blob.slice(SALT_LENGTH + IV_LENGTH);

    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Derive key
    const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, { name: 'PBKDF2' }, false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: KEY_LENGTH }, false, ['decrypt']);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, uint8ArrayToArrayBuffer(ciphertext));

    // decrypted is base64 private key string (per encryptPrivateKey) — convert to string
    const decBytes = new Uint8Array(decrypted);
    const privateKeyBase64 = Buffer.from(decBytes).toString('utf-8');
    console.error('DEBUG: privateKeyBase64 len', privateKeyBase64.length, 'startsWith', privateKeyBase64.slice(0, 16));

    // import private key as pkcs8 and sign challenge
    const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');
    const privateKeyUint8 = new Uint8Array(privateKeyBuffer);
    const keyArrayBuffer = privateKeyUint8.buffer.slice(privateKeyUint8.byteOffset, privateKeyUint8.byteOffset + privateKeyUint8.byteLength);
    const privateCryptoKey = await crypto.subtle.importKey('pkcs8', keyArrayBuffer, { name: 'Ed25519' }, false, ['sign']);

    const signature = await crypto.subtle.sign('Ed25519', privateCryptoKey, encoder.encode(challenge));
    const sigBase64 = Buffer.from(new Uint8Array(signature)).toString('base64');

    console.log(sigBase64);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
