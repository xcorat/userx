// Answer domain model
import type { AnswerVisibility, QuestionChoice } from './types';

export interface PublicAnswer {
	id: string;
	userId: string;
	questionId: string;
	choiceId: string;
	visibility: AnswerVisibility;
	createdAt: Date;
}

export interface CreateAnswerDTO {
	userId: string;
	questionId: string;
	choiceId: string;
	visibility: AnswerVisibility;
}

export interface AnswerWithQuestion extends PublicAnswer {
	question: {
		id: string;
		text: string;
		choices: QuestionChoice[];
	};
	choiceText: string;
}
