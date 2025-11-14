// API Route: Users
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteUserRepository } from '$lib/server/repositories';
import type { CreateUserDTO } from '$lib/models';

// GET /api/users - List all users (admin only - future)
export const GET: RequestHandler = async () => {
	try {
		const repo = new SQLiteUserRepository();
		const users = await repo.findAll();
		return json(users);
	} catch (error) {
		console.error('GET /api/users error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch users' },
			{ status: 500 }
		);
	}
};

// POST /api/users - Create new user
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: CreateUserDTO = await request.json();
		const repo = new SQLiteUserRepository();
		const user = await repo.create(data);
		return json(user, { status: 201 });
	} catch (error) {
		console.error('POST /api/users error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create user' },
			{ status: 400 }
		);
	}
};
