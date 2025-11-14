// Mock Answer Repository
import type { IAnswerRepository } from '../../interfaces/IAnswerRepository';
import type { PublicAnswer, CreateAnswerDTO, AnswerVisibility } from '$lib/models';
import { mockAnswers } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockAnswerRepository implements IAnswerRepository {
	private answers: PublicAnswer[] = [...mockAnswers];

	async findAll(): Promise<PublicAnswer[]> {
		return this.answers;
	}

	async findById(id: string): Promise<PublicAnswer | null> {
		return this.answers.find((a) => a.id === id) || null;
	}

	async findByUser(userId: string): Promise<PublicAnswer[]> {
		return this.answers.filter((a) => a.userId === userId);
	}

	async findByQuestion(questionId: string): Promise<PublicAnswer[]> {
		return this.answers.filter((a) => a.questionId === questionId);
	}

	async findByUserAndQuestion(userId: string, questionId: string): Promise<PublicAnswer | null> {
		return this.answers.find((a) => a.userId === userId && a.questionId === questionId) || null;
	}

	async findPublicByQuestion(questionId: string): Promise<PublicAnswer[]> {
		return this.answers.filter((a) => a.questionId === questionId && a.visibility === 'public');
	}

	async create(data: CreateAnswerDTO): Promise<PublicAnswer> {
		const answer: PublicAnswer = {
			id: `ans_${Date.now()}`,
			userId: data.userId,
			questionId: data.questionId,
			choiceId: data.choiceId,
			visibility: data.visibility,
			createdAt: new Date()
		};
		this.answers.push(answer);
		return answer;
	}

	async updateVisibility(id: string, visibility: AnswerVisibility): Promise<PublicAnswer> {
		const index = this.answers.findIndex((a) => a.id === id);
		if (index === -1) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Answer not found');
		}

		this.answers[index].visibility = visibility;
		return this.answers[index];
	}

	async delete(id: string): Promise<void> {
		this.answers = this.answers.filter((a) => a.id !== id);
	}
}
