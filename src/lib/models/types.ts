// Core type definitions

export enum AnswerVisibility {
	PUBLIC = 'public',
	PRIVATE = 'private'
}

export enum SortOption {
	NEWEST = 'newest',
	TRENDING = 'trending',
	RANDOM = 'random'
}

export type QuestionChoice = {
	id: string;
	text: string;
	order: number;
};

export type AnswerAggregate = {
	choiceId: string;
	count: number;
	percentage: number;
};
