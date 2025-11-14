// Aggregate statistics model
import type { AnswerAggregate } from './types';

export interface QuestionAggregates {
	questionId: string;
	totalPublicAnswers: number;
	aggregates: AnswerAggregate[];
	lastUpdated: Date;
}

export interface GlobalStats {
	totalUsers: number;
	totalQuestions: number;
	totalAnswers: number;
	totalPublicAnswers: number;
}
