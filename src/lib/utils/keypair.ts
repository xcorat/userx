// Ed25519 Keypair Generation and Signing Utilities
// Uses Web Crypto API for secure key operations

export interface KeyPair {
	publicKey: string;
	privateKey: string;
}

/**
 * Generate an Ed25519 keypair for user identity
 * @returns KeyPair with base64-encoded public and private keys
 */
export async function generateEd25519KeyPair(): Promise<KeyPair> {
	// Generate Ed25519 keypair using Web Crypto API
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'Ed25519',
			namedCurve: 'Ed25519'
		} as any, // Type assertion for Ed25519 support
		true, // extractable
		['sign', 'verify']
	);

	// Export public key
	const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
	const publicKeyBase64 = bufferToBase64(publicKeyBuffer);

	// Export private key
	const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
	const privateKeyBase64 = bufferToBase64(privateKeyBuffer);

	return {
		publicKey: publicKeyBase64,
		privateKey: privateKeyBase64
	};
}

/**
 * Sign a challenge string using Ed25519 private key
 * @param challenge - The challenge string to sign
 * @param privateKeyBase64 - Base64-encoded private key
 * @returns Base64-encoded signature
 */
export async function signChallenge(
	challenge: string,
	privateKeyBase64: string
): Promise<string> {
	// Import private key
	const privateKeyBuffer = base64ToBuffer(privateKeyBase64);
	const privateKey = await crypto.subtle.importKey(
		'pkcs8',
		privateKeyBuffer,
		{
			name: 'Ed25519',
			namedCurve: 'Ed25519'
		} as any,
		false,
		['sign']
	);

	// Sign the challenge
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(challenge);
	const signatureBuffer = await crypto.subtle.sign('Ed25519', privateKey, dataBuffer);

	return bufferToBase64(signatureBuffer);
}

/**
 * Verify an Ed25519 signature
 * @param challenge - The original challenge string
 * @param signatureBase64 - Base64-encoded signature
 * @param publicKeyBase64 - Base64-encoded public key
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
	challenge: string,
	signatureBase64: string,
	publicKeyBase64: string
): Promise<boolean> {
	try {
		// Import public key
		const publicKeyBuffer = base64ToBuffer(publicKeyBase64);
		const publicKey = await crypto.subtle.importKey(
			'spki',
			publicKeyBuffer,
			{
				name: 'Ed25519',
				namedCurve: 'Ed25519'
			} as any,
			false,
			['verify']
		);

		// Verify signature
		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(challenge);
		const signatureBuffer = base64ToBuffer(signatureBase64);

		return await crypto.subtle.verify('Ed25519', publicKey, signatureBuffer, dataBuffer);
	} catch (error) {
		console.error('Signature verification error:', error);
		return false;
	}
}

/**
 * Convert ArrayBuffer to base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}
