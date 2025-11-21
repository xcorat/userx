// Application configuration
export const appConfig = {
	app: {
		name: 'QnA App',
		version: '0.1.0',
		description: 'Personality profile through questions'
	},

	features: {
		maxChoicesPerQuestion: 6,
		minChoicesPerQuestion: 2,
		maxQuestionTextLength: 500,
		maxChoiceTextLength: 100,
		maxUserNameLength: 100,
		defaultSortOption: 'newest' as const,
		enableQuestionImages: true,
		maxImageUrlLength: 2048,
		allowedImageDomains: [
			'imgur.com',
			'unsplash.com',
			'pexels.com',
			'pixabay.com',
			'picsum.photos'
		]
	},

	ui: {
		questionsPerPage: 20,
		avatarFallbackColor: '#6366f1',
		toastDuration: 3000
	},

	storage: {
		type: 'api' as 'mock' | 'sqlite' | 'd1' | 'api',
		localStorageKey: 'qna_app_state',
		// Database configuration
		// - SQLite: Local development (better-sqlite3)
		// - D1: Cloudflare Workers production (auto-detected)
		// - API: Client-side access through SvelteKit API routes
		dbPath: 'qna-app.db',
		// API configuration - relative URL since SvelteKit serves both frontend and API
		apiBaseUrl: '/api',
		bootstrapSkippedKey: 'qna_memeball_skipped'
	},

	auth: {
		sessionStorageKey: 'qna_session',
		rememberMeDays: 30
	}
} as const;

export type AppConfig = typeof appConfig;
