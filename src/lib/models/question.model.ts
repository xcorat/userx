// Question domain model
import type { QuestionChoice, AnswerVisibility } from './types';

export interface PublicQuestion {
	id: string;
	text: string;
	choices: QuestionChoice[];
	createdBy: string;
	createdAt: Date;
}

export interface CreateQuestionDTO {
	text: string;
	choices: Omit<QuestionChoice, 'id'>[];
	createdBy: string;
}

export interface QuestionWithStats extends PublicQuestion {
	totalAnswers: number;
	userAnswered: boolean;
	userAnswerVisibility?: AnswerVisibility;
}
