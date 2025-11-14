// Mock DM Repository
import type { IDMRepository } from '../../interfaces/IDMRepository';
import type { DMQuestion, CreateDMQuestionDTO, DMAnswer, CreateDMAnswerDTO } from '$lib/models';
import { mockDMQuestions, mockDMAnswers } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockDMRepository implements IDMRepository {
	private dmQuestions: DMQuestion[] = [...mockDMQuestions];
	private dmAnswers: DMAnswer[] = [...mockDMAnswers];

	async findQuestionById(id: string): Promise<DMQuestion | null> {
		return this.dmQuestions.find((q) => q.id === id) || null;
	}

	async findQuestionsByRecipient(recipientId: string): Promise<DMQuestion[]> {
		return this.dmQuestions.filter((q) => q.recipientId === recipientId);
	}

	async findQuestionsBySender(senderId: string): Promise<DMQuestion[]> {
		return this.dmQuestions.filter((q) => q.senderId === senderId);
	}

	async createQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion> {
		const question: DMQuestion = {
			id: `dmq_${Date.now()}`,
			senderId: data.senderId,
			recipientId: data.recipientId,
			text: data.text,
			choices: data.choices?.map((c, idx) => ({
				id: `dmchoice_${Date.now()}_${idx}`,
				text: c.text,
				order: c.order
			})),
			createdAt: new Date()
		};
		this.dmQuestions.push(question);
		return question;
	}

	async deleteQuestion(id: string): Promise<void> {
		this.dmQuestions = this.dmQuestions.filter((q) => q.id !== id);
	}

	async findAnswerByQuestion(dmQuestionId: string): Promise<DMAnswer | null> {
		return this.dmAnswers.find((a) => a.dmQuestionId === dmQuestionId) || null;
	}

	async createAnswer(data: CreateDMAnswerDTO): Promise<DMAnswer> {
		const answer: DMAnswer = {
			id: `dmans_${Date.now()}`,
			dmQuestionId: data.dmQuestionId,
			userId: data.userId,
			choiceId: data.choiceId,
			textAnswer: data.textAnswer,
			createdAt: new Date()
		};
		this.dmAnswers.push(answer);
		return answer;
	}

	async deleteAnswer(id: string): Promise<void> {
		this.dmAnswers = this.dmAnswers.filter((a) => a.id !== id);
	}
}
