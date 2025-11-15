// Validation utilities
import { appConfig } from '$lib/config/app.config';
import { AppError, ErrorCode } from './error-handling';

export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function validateQuestionText(text: string): void {
	if (!text || text.trim().length === 0) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Question text is required');
	}
	if (text.length > appConfig.features.maxQuestionTextLength) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			`Question text must be ${appConfig.features.maxQuestionTextLength} characters or less`
		);
	}
}

export function validateChoiceText(text: string): void {
	if (!text || text.trim().length === 0) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Choice text is required');
	}
	if (text.length > appConfig.features.maxChoiceTextLength) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			`Choice text must be ${appConfig.features.maxChoiceTextLength} characters or less`
		);
	}
}

export function validateChoicesCount(count: number): void {
	const { minChoicesPerQuestion, maxChoicesPerQuestion } = appConfig.features;
	if (count < minChoicesPerQuestion || count > maxChoicesPerQuestion) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			`Question must have between ${minChoicesPerQuestion} and ${maxChoicesPerQuestion} choices`
		);
	}
}

export function validateUserName(name: string): void {
	if (!name || name.trim().length === 0) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'User name is required');
	}
	if (name.length > appConfig.features.maxUserNameLength) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			`User name must be ${appConfig.features.maxUserNameLength} characters or less`
		);
	}
}

export function validateEmailFormat(email: string): void {
	if (!validateEmail(email)) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
	}
}

export function validateUsername(username: string): void {
	if (!username || username.trim().length === 0) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Username is required');
	}
	if (username.length < 3) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Username must be at least 3 characters');
	}
	if (username.length > 30) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Username must be 30 characters or less');
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			'Username can only contain letters, numbers, hyphens, and underscores'
		);
	}
}

export function validateImageUrl(url: string): void {
	if (!url || url.trim().length === 0) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Image URL is required');
	}
	if (url.length > appConfig.features.maxImageUrlLength) {
		throw new AppError(
			ErrorCode.VALIDATION_ERROR,
			`Image URL must be ${appConfig.features.maxImageUrlLength} characters or less`
		);
	}

	// Validate URL format
	try {
		const urlObj = new URL(url);
		if (!['http:', 'https:'].includes(urlObj.protocol)) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Image URL must use HTTP or HTTPS protocol');
		}
	} catch (e) {
		throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid image URL format');
	}

	// Check allowed domains if configured
	const allowedDomains = appConfig.features.allowedImageDomains;
	if (allowedDomains && allowedDomains.length > 0) {
		try {
			const urlObj = new URL(url);
			const hostname = urlObj.hostname.toLowerCase();
			const isAllowed = allowedDomains.some(domain => 
				hostname === domain.toLowerCase() || hostname.endsWith('.' + domain.toLowerCase())
			);
			if (!isAllowed) {
				throw new AppError(
					ErrorCode.VALIDATION_ERROR, 
					`Image URL must be from allowed domains: ${allowedDomains.join(', ')}`
				);
			}
		} catch (e) {
			if (e instanceof AppError) throw e;
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid image URL format');
		}
	}
}
