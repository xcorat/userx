// API Route: DM Answer by ID
// Note: Interface only supports findAnswerByQuestion, not by answer ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	return json(
		{ error: 'Not implemented - use /api/dm/answers?questionId={id} instead' },
		{ status: 501 }
	);
};
