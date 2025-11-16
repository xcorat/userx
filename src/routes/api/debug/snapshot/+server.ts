// Debug API: Database Snapshot Endpoint
// Returns complete database snapshot for testing/debugging
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

/**
 * GET /api/debug/snapshot
 * Returns complete database snapshot including all tables with full data
 * Useful for testing, debugging, and data inspection
 */
export const GET: RequestHandler = async () => {
try {
const snapshot = await ServerRepositoryFactory.getDebugSnapshot();
return json(snapshot);
} catch (error) {
console.error('GET /api/debug/snapshot error:', error);
return json(
{ 
error: error instanceof Error ? error.message : 'Failed to fetch database snapshot',
repoType: null,
timestamp: new Date().toISOString(),
tables: {}
},
{ status: 500 }
);
}
};
