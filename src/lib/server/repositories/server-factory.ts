// Server-side Repository Factory
// Uses opaque dynamic imports (string concatenation) to prevent bundler
// from statically analyzing and including both database drivers

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';

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
        // Check if we're running in a real Cloudflare Workers environment
        // vs SvelteKit dev server with adapter emulation
        const hasD1Binding = !!platform?.env?.DB;
        const isRealCloudflare = hasD1Binding && (
            typeof process === 'undefined' || // Workers runtime has no process
            process.env.CF_PAGES === '1' ||   // Cloudflare Pages
            process.env.CLOUDFLARE_ACCOUNT_ID // Wrangler environment
        );
        
        console.log('[ServerRepositoryFactory] Environment detection:', {
            hasD1Binding,
            isRealCloudflare,
            hasProcess: typeof process !== 'undefined',
            nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'unknown'
        });
        
        if (isRealCloudflare) {
            // True Cloudflare Workers environment
            D1RepositoryFactory.initialize(platform!.env.DB);
            activeFactory = 'd1';
            console.log('[ServerRepositoryFactory] Initialized with D1 database');
        } else {
            // Local development with SQLite
            // CRITICAL: Use opaque import path (string concatenation)
            // Bundler cannot statically resolve this, so SQLite won't be bundled for Cloudflare
            try {
                const modulePath = './sqlite-factory' + ''; // opaque path - bundler can't resolve
                sqliteFactory = (await import(/* @vite-ignore */ modulePath)).SQLiteRepositoryFactory;
                sqliteFactory.initialize();
                activeFactory = 'sqlite';
                console.log('[ServerRepositoryFactory] Initialized with SQLite database');
            } catch (error) {
                throw new Error(
                    'Failed to initialize SQLite: not in Node.js environment. ' +
                    'Are you trying to run in Cloudflare Workers? Ensure DB is bound in wrangler.jsonc'
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
}