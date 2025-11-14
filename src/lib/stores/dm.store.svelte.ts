// DM Store using Svelte 5 runes
import type { DMConversation, CreateDMQuestionDTO, CreateDMAnswerDTO } from '$lib/models';
import DIContainer from '$lib/config/di-container';
import { authStore } from './auth.store.svelte';

class DMStore {
	receivedConversations = $state<DMConversation[]>([]);
	sentConversations = $state<DMConversation[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	async loadInbox() {
		if (!authStore.currentUser) return;

		this.isLoading = true;
		this.error = null;

		try {
			const dmService = DIContainer.getDMService();
			this.receivedConversations = await dmService.getDMInbox(authStore.currentUser.id);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load inbox';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	async loadSent() {
		if (!authStore.currentUser) return;

		this.isLoading = true;
		this.error = null;

		try {
			const dmService = DIContainer.getDMService();
			this.sentConversations = await dmService.getSentDMQuestions(authStore.currentUser.id);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load sent DMs';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	async sendQuestion(data: CreateDMQuestionDTO) {
		try {
			const dmService = DIContainer.getDMService();
			await dmService.sendDMQuestion(data);
			
			// Reload sent questions
			await this.loadSent();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to send DM question';
			throw e;
		}
	}

	async answerQuestion(data: CreateDMAnswerDTO) {
		try {
			const dmService = DIContainer.getDMService();
			await dmService.answerDMQuestion(data);
			
			// Reload inbox to get updated state
			await this.loadInbox();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to answer DM';
			throw e;
		}
	}
}

export const dmStore = new DMStore();
