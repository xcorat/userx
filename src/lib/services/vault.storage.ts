import { browser } from '$app/environment';

const VAULT_STORAGE_KEY = 'araliya_vault_v1';
const SESSION_TOKEN_KEY = 'araliya_session_token';
const IDB_NAME = 'araliya_userx_keys';
const IDB_STORE = 'session_keys';
const IDB_SESSION_KEY = 'araliya_session_key';

const LEGACY_KEYS = ['userx_session_v1', 'userx_ledger_v1'] as const;

interface QuickUnlockToken {
	iv: string;
	ciphertext: string;
	pubkey: string;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
	const binary = atob(b64);
	const out = new Uint8Array(new ArrayBuffer(binary.length));
	for (let i = 0; i < binary.length; i += 1) {
		out[i] = binary.charCodeAt(i);
	}
	return out;
}

function openKeyDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (!browser || typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB unavailable'));
			return;
		}
		const req = indexedDB.open(IDB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(IDB_STORE)) {
				db.createObjectStore(IDB_STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
	});
}

async function idbOp<T>(
	mode: IDBTransactionMode,
	run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await openKeyDb();
	try {
		return await new Promise<T>((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, mode);
			const store = tx.objectStore(IDB_STORE);
			const req = run(store);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
		});
	} finally {
		db.close();
	}
}

/** Remove legacy plaintext session and ledger keys from `localStorage`. */
export function purgeLegacyPlaintextStorage(): void {
	if (!browser) return;
	for (const key of LEGACY_KEYS) {
		localStorage.removeItem(key);
	}
}

export function hasStoredVault(): boolean {
	return loadStoredVault() !== null;
}

export function loadStoredVault(): string | null {
	if (!browser) return null;
	const raw = localStorage.getItem(VAULT_STORAGE_KEY);
	return raw && raw.trim().length > 0 ? raw : null;
}

export function saveStoredVault(vaultJson: string): void {
	if (!browser) return;
	localStorage.setItem(VAULT_STORAGE_KEY, vaultJson);
}

export function deleteStoredVault(): void {
	if (!browser) return;
	localStorage.removeItem(VAULT_STORAGE_KEY);
}

/**
 * Seal the unlocked 32-byte primary secret key in `sessionStorage` encrypted under a
 * non-extractable WebCrypto `CryptoKey` stored in IndexedDB.
 */
export async function saveQuickUnlockSecret(
	secretKeyB64: string,
	pubkey: string
): Promise<void> {
	if (!browser || !crypto?.subtle || typeof indexedDB === 'undefined') return;
	let skBytes: Uint8Array<ArrayBuffer> | null = null;
	try {
		skBytes = base64ToBytes(secretKeyB64);
		if (skBytes.length !== 32) return;

		const kek = await crypto.subtle.generateKey(
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
		const iv = new Uint8Array(new ArrayBuffer(12));
		crypto.getRandomValues(iv);

		const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, skBytes);
		await idbOp('readwrite', (store) => store.put(kek, IDB_SESSION_KEY));

		const token: QuickUnlockToken = {
			iv: bytesToBase64(iv),
			ciphertext: bytesToBase64(new Uint8Array(encrypted)),
			pubkey
		};
		sessionStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(token));
	} catch {
		await clearQuickUnlockSession();
	} finally {
		skBytes?.fill(0);
	}
}

/**
 * Attempt to recover the 32-byte primary secret key for same-browser-session reload quick-unlock.
 * Callers must zero the returned `Uint8Array` with `.fill(0)` immediately after passing it to WASM.
 */
export async function loadQuickUnlockSecretBytes(): Promise<Uint8Array | null> {
	if (!browser || !crypto?.subtle || typeof indexedDB === 'undefined') return null;
	const rawToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
	if (!rawToken) return null;

	try {
		const token = JSON.parse(rawToken) as Partial<QuickUnlockToken>;
		if (!token.iv || !token.ciphertext) {
			await clearQuickUnlockSession();
			return null;
		}
		const kek = await idbOp<CryptoKey | undefined>('readonly', (store) =>
			store.get(IDB_SESSION_KEY)
		);
		if (!kek) {
			await clearQuickUnlockSession();
			return null;
		}

		const iv = base64ToBytes(token.iv);
		const ciphertext = base64ToBytes(token.ciphertext);
		const plaintext = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			kek,
			ciphertext
		);
		const bytes = new Uint8Array(plaintext);
		if (bytes.length !== 32) {
			bytes.fill(0);
			await clearQuickUnlockSession();
			return null;
		}
		return bytes;
	} catch {
		await clearQuickUnlockSession();
		return null;
	}
}

/** Clear the quick-unlock session token and non-extractable wrapping key. */
export async function clearQuickUnlockSession(): Promise<void> {
	if (!browser) return;
	sessionStorage.removeItem(SESSION_TOKEN_KEY);
	if (typeof indexedDB === 'undefined') return;
	try {
		await idbOp('readwrite', (store) => store.delete(IDB_SESSION_KEY));
	} catch {
		// Ignore IndexedDB cleanup failures on lock/unload
	}
}
