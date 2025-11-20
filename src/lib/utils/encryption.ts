// Password-Based Encryption for Private Keys
// Uses PBKDF2 + AES-256-GCM for secure client-side encryption

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // AES-256

/**
 * Encrypt a private key using a password
 * Returns a base64-encoded blob containing: salt|iv|ciphertext (with auth tag)
 * 
 * @param privateKey - Base64-encoded private key to encrypt
 * @param password - User's password for encryption
 * @returns Base64-encoded encrypted blob
 */
export async function encryptPrivateKey(
	privateKey: string,
	password: string
): Promise<string> {
	// Generate random salt and IV
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	// Derive AES key from password using PBKDF2
	const passwordKey = await deriveKey(password, salt);

	// Encrypt the private key
	const encoder = new TextEncoder();
	const privateKeyBytes = encoder.encode(privateKey);

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		passwordKey,
		privateKeyBytes
	);

	// Combine salt, IV, and ciphertext (which includes auth tag)
	const encryptedBlob = concatenateBuffers(salt, iv, new Uint8Array(ciphertext));

	// Return as base64
	return bufferToBase64(encryptedBlob);
}

/**
 * Decrypt an encrypted private key using a password
 * 
 * @param encryptedBlob - Base64-encoded encrypted blob (salt|iv|ciphertext)
 * @param password - User's password for decryption
 * @returns Base64-encoded private key
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export async function decryptPrivateKey(
	encryptedBlob: string,
	password: string
): Promise<string> {
	try {
		// Decode the blob
		const blobBytes = base64ToBuffer(encryptedBlob);

		// Extract salt, IV, and ciphertext
		const salt = blobBytes.slice(0, SALT_LENGTH);
		const iv = blobBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
		const ciphertext = blobBytes.slice(SALT_LENGTH + IV_LENGTH);

		// Derive AES key from password using the stored salt
		const passwordKey = await deriveKey(password, salt);

		// Decrypt
		const decryptedBytes = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: iv
			},
			passwordKey,
			ciphertext
		);

		// Convert back to string
		const decoder = new TextDecoder();
		return decoder.decode(decryptedBytes);
	} catch (error) {
		throw new Error('Decryption failed: Invalid password or corrupted data');
	}
}

/**
 * Derive an AES key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const passwordBytes = encoder.encode(password);

	// Import password as key material
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBytes,
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	// Derive AES key
	return await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		{
			name: 'AES-GCM',
			length: KEY_LENGTH
		},
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatenateBuffers(...arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

/**
 * Convert Uint8Array to base64 string
 */
function bufferToBase64(buffer: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < buffer.length; i++) {
		binary += String.fromCharCode(buffer[i]);
	}
	return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
