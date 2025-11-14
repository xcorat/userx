// API Route: Find user by email
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteUserRepository } from '$lib/server/repositories';

// GET /api/users/email/[email] - Find user by email
export const GET: RequestHandler = async ({ params }) => {
	try {
		const email = decodeURIComponent(params.email);
		const repo = new SQLiteUserRepository();
		const user = await repo.findByEmail(email);
		
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}
		
		return json(user);
	} catch (error) {
		console.error(`GET /api/users/email/${params.email} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch user' },
			{ status: 500 }
		);
	}
};
