// Memeball Database Test Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /memeball/test - Get memeball repository debug information
export const GET: RequestHandler = async () => {
	try {
		// Use the debug API to get full snapshot
		const snapshot = await ServerRepositoryFactory.getDebugSnapshot();
		
		// Filter to memeball-related tables only
		const memeballTables = ['memes', 'meme_interactions'].map(tableName => {
			const tableData = snapshot.tables[tableName];
			return {
				name: tableName,
				count: tableData?.count || 0,
				sampleRows: (tableData?.data || []).slice(0, 3)
			};
		});

		return json({
			repoType: snapshot.repoType,
			timestamp: snapshot.timestamp,
			tableCount: memeballTables.length,
			tables: memeballTables
		});
	} catch (error) {
		console.error('GET /memeball/test error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch memeball database info' },
			{ status: 500 }
		);
	}
};
