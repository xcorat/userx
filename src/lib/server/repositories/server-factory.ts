// Server-side Repository Factory
// Uses opaque dynamic imports (string concatenation) to prevent bundler
// from statically analyzing and including both database drivers

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

// Only static import D1 factory (safe for Cloudflare Workers)
import { D1RepositoryFactory } from '$lib/server/repositories/d1-factory';

type RepositoryType = 'sqlite' | 'd1';

let activeFactory: 'sqlite' | 'd1' | null = null;
let sqliteFactory: any = null;

/**
 * Server-side Repository Factory
 * Instantiates the correct repository implementation based on runtime environment
 * - SQLite for local development (pnpm dev)
 * - D1 for Cloudflare Workers production
 * 
 * KEY: Uses opaque dynamic imports (string concatenation) so bundler
 * cannot statically resolve the SQLite factory path. This prevents
 * better-sqlite3 and Node.js modules from being included in Cloudflare bundle.
 */
export class ServerRepositoryFactory {
    /**
     * Initialize the factory with platform environment
     * Should be called once at app startup (in hooks.server.ts)
     */
    static async initialize(platform?: App.Platform): Promise<void> {
        // Environment detection:
        // - NODE_ENV=development: Use SQLite (local development)
        // - NODE_ENV=production or undefined: Use D1 (Cloudflare Workers)
        const isProduction = typeof process !== 'undefined' 
            ? process.env.NODE_ENV === 'production' || process.env.CF_PAGES === '1'
            : true; // No process object means Workers environment
        const hasD1Binding = !!platform?.env?.DB;
        
        console.log('[ServerRepositoryFactory] Environment detection:', {
            hasD1Binding,
            isProduction,
            hasProcess: typeof process !== 'undefined',
            nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'workers-runtime'
        });
        
        if (isProduction && hasD1Binding) {
            // True Cloudflare Workers environment
            D1RepositoryFactory.initialize(platform!.env.DB);
            activeFactory = 'd1';
            console.log('[ServerRepositoryFactory] Initialized with D1 database');
        } else {
            // Local development with SQLite
            // CRITICAL: Use opaque import path (string concatenation)
            // Bundler cannot statically resolve this, so SQLite won't be bundled for Cloudflare
            try {
                // Use direct import in development - no need for opaque paths in Node.js
                const { SQLiteRepositoryFactory } = await import('./sqlite-factory');
                sqliteFactory = SQLiteRepositoryFactory;
                await sqliteFactory.initialize();
                activeFactory = 'sqlite';
                console.log('[ServerRepositoryFactory] Initialized with SQLite database');
            } catch (error) {
                console.error('[ServerRepositoryFactory] SQLite initialization failed:', error);
                throw new Error(
                    `Failed to initialize SQLite: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
                    'Are you in a Node.js environment? If in Cloudflare Workers, ensure DB is bound in wrangler.jsonc'
                );
            }
        }
    }

    /**
     * Get current repository type
     */
    static getType(): RepositoryType {
        if (!activeFactory) {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
        return activeFactory;
    }

    /**
     * Reset factory (useful for testing)
     */
    static reset(): void {
        if (activeFactory === 'd1') {
            D1RepositoryFactory.reset();
        } else if (sqliteFactory) {
            sqliteFactory.reset();
        }
        activeFactory = null;
        sqliteFactory = null;
    }

    /**
     * Get User Repository
     */
    static getUserRepository(): IUserRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getUserRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getUserRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }

    /**
     * Get Question Repository
     */
    static getQuestionRepository(): IQuestionRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getQuestionRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getQuestionRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }

    /**
     * Get Answer Repository
     */
    static getAnswerRepository(): IAnswerRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getAnswerRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getAnswerRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }

    /**
     * Get DM Repository
     */
    static getDMRepository(): IDMRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getDMRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getDMRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }

    /**
     * Get Memeball Repository
     */
    static getMemeRepository(): IMemeBallRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getMemeRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getMemeRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }

    /**
     * Get Relation Repository
     */
    static getRelationRepository(): IRelationRepository {
        if (activeFactory === 'd1') {
            return D1RepositoryFactory.getRelationRepository();
        } else if (activeFactory === 'sqlite' && sqliteFactory) {
            return sqliteFactory.getRelationRepository();
        } else {
            throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
        }
    }
}