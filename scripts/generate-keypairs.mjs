#!/usr/bin/env node
/**
 * Generate Ed25519 keypairs for test users
 * Run with: node scripts/generate-keypairs.mjs
 */

// Test password for encrypting all test user private keys
const TEST_PASSWORD = 'password';

// Helper functions for Web Crypto API (Node.js 20+)
async function generateEd25519KeyPair() {
	const keyPair = await crypto.subtle.generateKey(
		{ name: 'Ed25519' },
		true,
		['sign', 'verify']
	);

	const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
	const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

	return {
		publicKey: bufferToBase64(publicKeyBuffer),
		privateKey: bufferToBase64(privateKeyBuffer)
	};
}

async function encryptPrivateKey(privateKey, password) {
	const PBKDF2_ITERATIONS = 100000;
	const SALT_LENGTH = 16;
	const IV_LENGTH = 12;

	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	const encoder = new TextEncoder();
	const passwordBytes = encoder.encode(password);

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBytes,
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	const key = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	const privateKeyBytes = encoder.encode(privateKey);
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: iv },
		key,
		privateKeyBytes
	);

	const encryptedBlob = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
	encryptedBlob.set(salt, 0);
	encryptedBlob.set(iv, salt.length);
	encryptedBlob.set(new Uint8Array(ciphertext), salt.length + iv.length);

	return bufferToBase64(encryptedBlob.buffer);
}

function bufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Buffer.from(binary, 'binary').toString('base64');
}

// Test user data
const testUsers = [
	{ username: 'alicejohnson', name: 'Alice Johnson', email: 'alice@example.com' },
	{ username: 'bobsmith', name: 'Bob Smith', email: 'bob@example.com' },
	{ username: 'caroldavis', name: 'Carol Davis', email: 'carol@example.com' },
	{ username: 'davidwilson', name: 'David Wilson', email: 'david@example.com' },
	{ username: 'emmabrown', name: 'Emma Brown', email: 'emma@example.com' }
];

async function main() {
	console.log('Generating Ed25519 keypairs for test users...\n');
	console.log(`Test password: "${TEST_PASSWORD}"\n`);

	const keypairs = [];

	for (const user of testUsers) {
		console.log(`Generating keypair for ${user.name} (${user.username})...`);
		
		const { publicKey, privateKey } = await generateEd25519KeyPair();
		const encryptedPrivateKey = await encryptPrivateKey(privateKey, TEST_PASSWORD);

		keypairs.push({
			user,
			publicKey,
			encryptedPrivateKey
		});

		console.log(`  Public Key:  ${publicKey.substring(0, 40)}...`);
		console.log(`  Encrypted:   ${encryptedPrivateKey.substring(0, 40)}...\n`);
	}

	// Output TypeScript/JavaScript format
	console.log('\n=== TypeScript/JavaScript Format ===\n');
	console.log('export const testKeypairs = [');
	for (const kp of keypairs) {
		console.log('  {');
		console.log(`    username: '${kp.user.username}',`);
		console.log(`    name: '${kp.user.name}',`);
		console.log(`    email: '${kp.user.email}',`);
		console.log(`    publicKey: '${kp.publicKey}',`);
		console.log(`    encryptedPrivateKey: '${kp.encryptedPrivateKey}'`);
		console.log('  },');
	}
	console.log('];\n');

	// Output SQL INSERT format
	console.log('\n=== SQL INSERT Statements ===\n');
	console.log('-- User keypairs');
	for (const kp of keypairs) {
		console.log(`-- ${kp.user.name}`);
		console.log(`INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('${kp.publicKey}', '${kp.encryptedPrivateKey}', datetime('now'));`);
	}
}

main().catch(console.error);
