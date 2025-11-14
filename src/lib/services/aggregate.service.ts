// Aggregate Service
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { QuestionAggregates, AnswerAggregate } from '$lib/models';

export class AggregateService {
	constructor(
		private answerRepo: IAnswerRepository,
		private questionRepo: IQuestionRepository
	) {}

	async getQuestionAggregates(questionId: string): Promise<QuestionAggregates | null> {
		const question = await this.questionRepo.findById(questionId);
		if (!question) return null;

		const publicAnswers = await this.answerRepo.findPublicByQuestion(questionId);
		const total = publicAnswers.length;

		// Count answers per choice
		const choiceCounts = new Map<string, number>();
		publicAnswers.forEach((answer) => {
			const count = choiceCounts.get(answer.choiceId) || 0;
			choiceCounts.set(answer.choiceId, count + 1);
		});

		// Build aggregates
		const aggregates: AnswerAggregate[] = question.choices.map((choice) => ({
			choiceId: choice.id,
			count: choiceCounts.get(choice.id) || 0,
			percentage: total > 0 ? ((choiceCounts.get(choice.id) || 0) / total) * 100 : 0
		}));

		return {
			questionId,
			totalPublicAnswers: total,
			aggregates,
			lastUpdated: new Date()
		};
	}

	async getAllAggregates(): Promise<QuestionAggregates[]> {
		const questions = await this.questionRepo.findAll();
		const aggregates = await Promise.all(questions.map((q) => this.getQuestionAggregates(q.id)));
		return aggregates.filter((a) => a !== null) as QuestionAggregates[];
	}
}
