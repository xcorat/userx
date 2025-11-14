// API Route: Database Test/Debug Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '$lib/server/db/database';

interface TableInfo {
	name: string;
	count: number;
	sampleRows: any[];
}

// GET /tests - Get database debug information
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		
		// Get all table names
		const tables = db.prepare(`
			SELECT name FROM sqlite_master 
			WHERE type='table' 
			AND name NOT LIKE 'sqlite_%'
			ORDER BY name
		`).all() as { name: string }[];
		
		// Get counts and sample data for each table
		const tableData: TableInfo[] = [];
		
		for (const table of tables) {
			const tableName = table.name;
			
			// Get count
			const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
			const count = countResult.count;
			
			// Get sample rows (limit 10)
			const sampleRows = db.prepare(`SELECT * FROM ${tableName} LIMIT 10`).all();
			
			tableData.push({
				name: tableName,
				count,
				sampleRows
			});
		}
		
		// Get database metadata
		const dbStats = {
			tableCount: tables.length,
			timestamp: new Date().toISOString(),
			tables: tableData
		};
		
		return json(dbStats);
	} catch (error) {
		console.error('GET /tests error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch database info' },
			{ status: 500 }
		);
	}
};
