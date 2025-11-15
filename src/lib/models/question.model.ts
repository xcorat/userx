// Question domain model
import type { QuestionChoice, AnswerVisibility } from './types';

export interface PublicQuestion {
	id: string;
	text: string;
	choices: QuestionChoice[];
	imageHashId?: string;  // Reference to image (stored in separate table)
	createdBy: string;
	createdAt: Date;
}

export interface CreateQuestionDTO {
	text: string;
	choices: Omit<QuestionChoice, 'id'>[];
	imageUrl?: string;     // Client provides URL during creation
	createdBy: string;
}

export interface QuestionWithStats extends PublicQuestion {
	totalAnswers: number;
	userAnswered: boolean;
	userAnswerVisibility?: AnswerVisibility;
}
