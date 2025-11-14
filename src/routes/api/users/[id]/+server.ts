// API Route: User by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import type { UpdateUserDTO } from '$lib/models';

// GET /api/users/[id] - Get user by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getUserRepository();
		const user = await repo.findById(params.id);
		
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}
		
		return json(user);
	} catch (error) {
		console.error(`GET /api/users/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch user' },
			{ status: 500 }
		);
	}
};

// PATCH /api/users/[id] - Update user
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const repo = ServerRepositoryFactory.getUserRepository();
		const data: UpdateUserDTO = await request.json();
		const user = await repo.update(params.id, data);
		return json(user);
	} catch (error) {
		console.error(`PATCH /api/users/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to update user' },
			{ status: 400 }
		);
	}
};

// DELETE /api/users/[id] - Delete user
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getUserRepository();
		await repo.delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error(`DELETE /api/users/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to delete user' },
			{ status: 500 }
		);
	}
};
