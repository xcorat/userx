// Questions Store using Svelte 5 runes
import type { QuestionWithStats, CreateAnswerDTO } from '$lib/models';
import type { SortOption } from '$lib/utils/sorting';
import DIContainer from '$lib/config/di-container';
import { authStore } from './auth.store.svelte';

class QuestionsStore {
	questions = $state<QuestionWithStats[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	currentSort = $state<SortOption>('newest');
	
	// Pagination state
	currentPage = $state(1);
	pageSize = $state(20);
	totalItems = $state(0);
	totalPages = $state(0);
	hasMore = $state(false);

	async loadQuestions(sortBy: SortOption = 'newest', page: number = 1) {
		this.isLoading = true;
		this.error = null;
		this.currentSort = sortBy;
		this.currentPage = page;

		try {
			const questionService = DIContainer.getQuestionService();
			const result = await questionService.getPublicQuestionsPaginated(
				page,
				this.pageSize,
				sortBy,
				authStore.currentUser?.id
			);
			
			this.questions = result.questions;
			this.currentPage = result.pagination.page;
			this.totalItems = result.pagination.total;
			this.totalPages = result.pagination.totalPages;
			this.hasMore = result.pagination.hasMore;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load questions';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	async nextPage() {
		if (this.hasMore && !this.isLoading) {
			await this.loadQuestions(this.currentSort, this.currentPage + 1);
		}
	}

	async previousPage() {
		if (this.currentPage > 1 && !this.isLoading) {
			await this.loadQuestions(this.currentSort, this.currentPage - 1);
		}
	}

	async goToPage(page: number) {
		if (page >= 1 && page <= this.totalPages && !this.isLoading) {
			await this.loadQuestions(this.currentSort, page);
		}
	}

	async answerQuestion(data: CreateAnswerDTO) {
		try {
			const answerService = DIContainer.getAnswerService();
			await answerService.createAnswer(data);

			// Reload current page to update stats
			await this.loadQuestions(this.currentSort, this.currentPage);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to answer question';
			throw e;
		}
	}
}

export const questionsStore = new QuestionsStore();
