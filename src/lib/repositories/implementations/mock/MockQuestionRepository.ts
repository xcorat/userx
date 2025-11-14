// Mock Question Repository
import type { IQuestionRepository } from '../../interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO } from '$lib/models';
import { mockQuestions } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockQuestionRepository implements IQuestionRepository {
	private questions: PublicQuestion[] = [...mockQuestions];

	async findAll(): Promise<PublicQuestion[]> {
		return this.questions;
	}

	async findById(id: string): Promise<PublicQuestion | null> {
		return this.questions.find((q) => q.id === id) || null;
	}

	async findByCreator(userId: string): Promise<PublicQuestion[]> {
		return this.questions.filter((q) => q.createdBy === userId);
	}

	async create(data: CreateQuestionDTO): Promise<PublicQuestion> {
		const question: PublicQuestion = {
			id: `q_${Date.now()}`,
			text: data.text,
			choices: data.choices.map((c, idx) => ({
				id: `choice_${Date.now()}_${idx}`,
				text: c.text,
				order: c.order
			})),
			createdBy: data.createdBy,
			createdAt: new Date()
		};
		this.questions.push(question);
		return question;
	}

	async delete(id: string): Promise<void> {
		this.questions = this.questions.filter((q) => q.id !== id);
	}
}
