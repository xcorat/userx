// Sorting utilities
import type { PublicQuestion } from '$lib/models';

export type SortOption = 'newest' | 'trending' | 'random';

export function sortQuestions(
	questions: PublicQuestion[],
	sortBy: SortOption
): PublicQuestion[] {
	switch (sortBy) {
		case 'newest':
			return [...questions].sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
			);

		case 'trending':
			// For POC, trending is same as newest
			return [...questions].sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
			);

		case 'random':
			return [...questions].sort(() => Math.random() - 0.5);

		default:
			return questions;
	}
}
