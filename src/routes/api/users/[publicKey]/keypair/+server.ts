// API Route: Get User Keypair
// Returns encrypted private key for a given public key
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { publicKey } = params;

		if (!publicKey) {
			return json({ error: 'Public key is required' }, { status: 400 });
		}

		const repo = ServerRepositoryFactory.getUserRepository();
		const encryptedPrivateKey = await repo.getEncryptedPrivateKey(decodeURIComponent(publicKey));

		if (!encryptedPrivateKey) {
			return json({ error: 'Keypair not found' }, { status: 404 });
		}

		return json({ encryptedPrivateKey });
	} catch (error) {
		console.error('GET /api/users/:publicKey/keypair error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch keypair' },
			{ status: 500 }
		);
	}
};
