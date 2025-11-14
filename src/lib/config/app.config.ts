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
		defaultSortOption: 'newest' as const
	},

	ui: {
		questionsPerPage: 20,
		avatarFallbackColor: '#6366f1',
		toastDuration: 3000
	},

	storage: {
		type: 'api' as 'mock' | 'sqlite' | 'api',
		localStorageKey: 'qna_app_state',
		// Database configuration (for SQLite or future DB adapters)
		dbPath: 'qna-app.db',
		// API configuration - relative URL since SvelteKit serves both frontend and API
		apiBaseUrl: '/api'
	},

	auth: {
		sessionStorageKey: 'qna_session',
		rememberMeDays: 30
	}
} as const;

export type AppConfig = typeof appConfig;
