// Answer Repository Interface
import type { PublicAnswer, CreateAnswerDTO, AnswerVisibility } from '$lib/models';

export interface IAnswerRepository {
	findAll(): Promise<PublicAnswer[]>;
	findById(id: string): Promise<PublicAnswer | null>;
	findByUser(userId: string): Promise<PublicAnswer[]>;
	findByQuestion(questionId: string): Promise<PublicAnswer[]>;
	findByUserAndQuestion(userId: string, questionId: string): Promise<PublicAnswer | null>;
	findPublicByQuestion(questionId: string): Promise<PublicAnswer[]>;
	create(data: CreateAnswerDTO): Promise<PublicAnswer>;
	updateVisibility(id: string, visibility: AnswerVisibility): Promise<PublicAnswer>;
	delete(id: string): Promise<void>;
}
