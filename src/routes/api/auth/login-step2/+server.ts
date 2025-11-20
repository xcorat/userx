// API Route: Auth Login Step 2
// Verify signature and authenticate user
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { AuthService } from '$lib/services/auth.service';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { publicKey, challenge, signature } = await request.json() as { 
			publicKey: string; 
			challenge: string; 
			signature: string;
		};

		if (!publicKey || !challenge || !signature) {
			return json(
				{ error: 'Public key, challenge, and signature are required' },
				{ status: 400 }
			);
		}

		const userRepo = ServerRepositoryFactory.getUserRepository();
		const authService = new AuthService(userRepo);

		const user = await authService.loginStep2(publicKey, challenge, signature);

		return json(user);
	} catch (error) {
		console.error('POST /api/auth/login-step2 error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Login step 2 failed' },
			{ status: 401 }
		);
	}
};
