// Utility for managing hidden questions in localStorage

const STORAGE_KEY = 'qna-hidden-questions';

export function getHiddenQuestionIds(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		console.error('Failed to parse hidden questions from localStorage', e);
		return [];
	}
}

export function hideQuestion(questionId: string): void {
	if (typeof localStorage === 'undefined') return;
	const current = getHiddenQuestionIds();
	if (!current.includes(questionId)) {
		const updated = [...current, questionId];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	}
}

export function isQuestionHidden(questionId: string): boolean {
	const current = getHiddenQuestionIds();
	return current.includes(questionId);
}

