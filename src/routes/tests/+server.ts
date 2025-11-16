// API Route: Database Test/Debug Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /tests - Get complete database snapshot using debug API
export const GET: RequestHandler = async () => {
	try {
		// Use the debug API to get full snapshot
		const snapshot = await ServerRepositoryFactory.getDebugSnapshot();
		
		// Transform to frontend format
		const tables = Object.entries(snapshot.tables).map(([name, tableData]) => ({
			name,
			count: tableData.count,
			sampleRows: tableData.data.slice(0, 10) // Show first 10 rows
		}));

		return json({
			repoType: snapshot.repoType,
			timestamp: snapshot.timestamp,
			tableCount: tables.length,
			tables
		});
	} catch (error) {
		console.error('GET /tests error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch repository info' },
			{ status: 500 }
		);
	}
};
