// Question Repository Interface
import type { PublicQuestion, CreateQuestionDTO } from '$lib/models';

export interface IQuestionRepository {
	findAll(): Promise<PublicQuestion[]>;
	findById(id: string): Promise<PublicQuestion | null>;
	findByCreator(userId: string): Promise<PublicQuestion[]>;
	create(data: CreateQuestionDTO): Promise<PublicQuestion>;
	delete(id: string): Promise<void>;
}
