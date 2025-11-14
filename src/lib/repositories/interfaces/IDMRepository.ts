// DM Repository Interface
import type { DMQuestion, CreateDMQuestionDTO, DMAnswer, CreateDMAnswerDTO } from '$lib/models';

export interface IDMRepository {
	// DM Questions
	findQuestionById(id: string): Promise<DMQuestion | null>;
	findQuestionsByRecipient(recipientId: string): Promise<DMQuestion[]>;
	findQuestionsBySender(senderId: string): Promise<DMQuestion[]>;
	createQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion>;
	deleteQuestion(id: string): Promise<void>;

	// DM Answers
	findAnswerByQuestion(dmQuestionId: string): Promise<DMAnswer | null>;
	createAnswer(data: CreateDMAnswerDTO): Promise<DMAnswer>;
	deleteAnswer(id: string): Promise<void>;
}
