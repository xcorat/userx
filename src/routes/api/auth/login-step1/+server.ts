// API Route: Auth Login Step 1
// Get encrypted private key and challenge for a user
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { AuthService } from '$lib/services/auth.service';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { username } = await request.json() as { username: string };

		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		const userRepo = ServerRepositoryFactory.getUserRepository();
		const authService = new AuthService(userRepo);

		const response = await authService.loginStep1(username);

		return json(response);
	} catch (error) {
		console.error('POST /api/auth/login-step1 error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Login step 1 failed' },
			{ status: 400 }
		);
	}
};
