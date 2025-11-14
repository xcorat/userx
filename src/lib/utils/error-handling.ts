// Error handling utilities

export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	UNAUTHORIZED = 'UNAUTHORIZED',
	DUPLICATE_ERROR = 'DUPLICATE_ERROR',
	SERVER_ERROR = 'SERVER_ERROR'
}

export class AppError extends Error {
	constructor(
		public code: ErrorCode,
		message: string,
		public details?: unknown
	) {
		super(message);
		this.name = 'AppError';
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
	if (isAppError(error)) {
		return error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return 'An unknown error occurred';
}
