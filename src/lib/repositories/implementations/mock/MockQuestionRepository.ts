// Mock Question Repository
import type { IQuestionRepository } from '../../interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO, QuestionImage } from '$lib/models';
import { mockQuestions } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockQuestionRepository implements IQuestionRepository {
	private questions: PublicQuestion[] = [...mockQuestions];
	private images: Map<string, QuestionImage> = new Map(); // questionId -> image

	constructor() {
		// Initialize sample images with picsum.photos seeded URLs
		this.images.set('q_1', {
			hashId: 'img_weekend',
			imageUrl: 'https://picsum.photos/seed/weekend/400/300',
			uploadedAt: new Date('2024-03-01')
		});
		this.images.set('q_5', {
			hashId: 'img_nature',
			imageUrl: 'https://picsum.photos/seed/beachmountain/400/300',
			uploadedAt: new Date('2024-03-12')
		});
		this.images.set('q_8', {
			hashId: 'img_pets',
			imageUrl: 'https://picsum.photos/seed/pets/400/300',
			uploadedAt: new Date('2024-03-18')
		});
	}

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
		const questionId = `q_${Date.now()}`;
		let imageHashId: string | undefined;

		// Handle image if provided
		if (data.imageUrl) {
			imageHashId = `img_${Date.now()}`;
			
			// Store image in memory
			this.images.set(questionId, {
				hashId: imageHashId,
				imageUrl: data.imageUrl,
				uploadedAt: new Date()
			});
		}

		const question: PublicQuestion = {
			id: questionId,
			text: data.text,
			choices: data.choices.map((c, idx) => ({
				id: `choice_${Date.now()}_${idx}`,
				text: c.text,
				order: c.order
			})),
			imageHashId,
			createdBy: data.createdBy,
			createdAt: new Date()
		};
		this.questions.push(question);
		return question;
	}

	async delete(id: string): Promise<void> {
		this.questions = this.questions.filter((q) => q.id !== id);
		// Clean up associated image
		this.images.delete(id);
	}

	async findImageByQuestion(questionId: string): Promise<QuestionImage | null> {
		return this.images.get(questionId) || null;
	}
}
