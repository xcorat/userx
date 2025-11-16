// API Route: User by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import type { UpdateUserDTO } from '$lib/models';

// GET /api/users/[id] - Get user by ID or username
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getUserRepository();
		const { id } = params;
		
		// First try to find by ID (UUID format)
		let user = await repo.findById(id);
		
		// If not found and doesn't look like a UUID, try username
		if (!user && !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
			user = await repo.findByUsername(id);
		}
		
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
