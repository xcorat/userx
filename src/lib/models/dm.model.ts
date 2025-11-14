// DM Question domain model
import type { QuestionChoice } from './types';

export interface DMQuestion {
	id: string;
	senderId: string;
	recipientId: string;
	text: string;
	choices?: QuestionChoice[];
	createdAt: Date;
}

export interface CreateDMQuestionDTO {
	senderId: string;
	recipientId: string;
	text: string;
	choices?: Omit<QuestionChoice, 'id'>[];
}

export interface DMAnswer {
	id: string;
	dmQuestionId: string;
	userId: string;
	choiceId?: string;
	textAnswer?: string;
	createdAt: Date;
}

export interface CreateDMAnswerDTO {
	dmQuestionId: string;
	userId: string;
	choiceId?: string;
	textAnswer?: string;
}

export interface DMConversation {
	question: DMQuestion;
	answer?: DMAnswer;
	sender: {
		id: string;
		name: string;
		avatarUrl?: string;
	};
}
