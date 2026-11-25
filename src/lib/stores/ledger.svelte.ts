import {
	araliyaService,
	bytesToHex,
	pubkeyToHex,
	type QnaEventBatch
} from '$lib/services/araliya.service';
import type {
	AnsweredQuestionRecord,
	FieldVisibility,
	ProfileField,
	ProfileFieldKey,
	QuestionItem
} from '$lib/types';

type ProfileFieldMap = Record<ProfileFieldKey, ProfileField>;

interface RawPrivateResponse {
	questionCid: string;
	selectedLeafHex: string;
	visibility: FieldVisibility;
	answeredAt: string;
}

const PROFILE_KEYS = new Set<ProfileFieldKey>([
	'username',
	'realName',
	'dateOfBirth',
	'pronouns'
]);

function isProfileFieldKey(key: string): key is ProfileFieldKey {
	return PROFILE_KEYS.has(key as ProfileFieldKey);
}

/**
 * Build a deterministic pseudonymous handle for the public `users` relay directory
 * when a user chooses to keep their real `@username` strictly inside `/private`.
 */
export function buildPseudonymousHandle(pubkeyB64UrlOrHex: string, chars = 8): string {
	const hex = pubkeyToHex(pubkeyB64UrlOrHex) || 'anon00000000';
	return `gardener_${hex.slice(0, chars)}`;
}

function createInitialProfile(): ProfileFieldMap {
	const now = new Date().toISOString();
	return {
		username: {
			key: 'username',
			label: 'Username',
			value: '',
			visibility: 'public',
			required: true,
			updatedAt: now
		},
		realName: {
			key: 'realName',
			label: 'Name',
			value: '',
			visibility: 'private',
			required: false,
			updatedAt: now
		},
		dateOfBirth: {
			key: 'dateOfBirth',
			label: 'Date of Birth',
			value: '',
			visibility: 'private',
			required: false,
			updatedAt: now
		},
		pronouns: {
			key: 'pronouns',
			label: 'Pronouns',
			value: '',
			visibility: 'private',
			required: false,
			updatedAt: now
		}
	};
}

/**
 * Reactive store for user profile fields and Q&A state, backed exclusively
 * by in-memory WASM state and encrypted/public relay storage.
 */
class LedgerStore {
	profile = $state<ProfileFieldMap>(createInitialProfile());
	answers = $state<AnsweredQuestionRecord[]>([]);
	questions = $state<QuestionItem[]>([]);
	isLoadingQuestions = $state(false);
	isHydrating = $state(false);
	isLiveSyncActive = $state(false);
	loadError = $state<string | null>(null);

	private rawPrivateResponses: RawPrivateResponse[] = [];
	private activeRootPubkey = '';

	answeredCids = $derived(new Set(this.answers.map((a) => a.questionCid)));

	genesisQuestions = $derived(this.questions.filter((q) => q.ownerType === 'genesis'));
	communityQuestions = $derived(this.questions.filter((q) => q.ownerType === 'community'));

	nextGenesisQuestions = $derived(
		this.genesisQuestions.filter((q) => !this.answeredCids.has(q.cid))
	);

	nextCommunityQuestions = $derived(
		this.communityQuestions.filter((q) => !this.answeredCids.has(q.cid))
	);

	currentFeedQuestion = $derived<QuestionItem | null>(
		this.nextGenesisQuestions[0] ?? this.nextCommunityQuestions[0] ?? null
	);

	remainingGenesisCount = $derived(this.nextGenesisQuestions.length);
	remainingCommunityCount = $derived(this.nextCommunityQuestions.length);
	totalQuestionsCount = $derived(this.questions.length);

	publicLedgerProjection = $derived({
		profileFields: Object.values(this.profile).filter(
			(f) => f.visibility === 'public' && f.value.trim().length > 0
		),
		answers: this.answers.filter((a) => a.visibility === 'public')
	});

	privateEncryptedStore = $derived({
		cipher: 'XChaCha20-Poly1305',
		scope: 'UserPrivate',
		profileFields: Object.values(this.profile).filter((f) => f.value.trim().length > 0),
		answers: this.answers
	});

	private rebuildAnswers(): void {
		const questionByCid = new Map(this.questions.map((q) => [q.cid, q]));
		const existingByCid = new Map(this.answers.map((a) => [a.questionCid, a]));

		this.answers = this.rawPrivateResponses
			.map((raw) => {
				const q = questionByCid.get(raw.questionCid);
				const prev = existingByCid.get(raw.questionCid);
				const opt = q?.options.find((o) => o.leafHex === raw.selectedLeafHex);
				return {
					questionCid: raw.questionCid,
					questionText:
						q?.text ?? prev?.questionText ?? `Question ${raw.questionCid.slice(0, 12)}…`,
					ownerType: q?.ownerType ?? prev?.ownerType ?? 'community',
					selectedOptionId: opt?.id ?? prev?.selectedOptionId ?? raw.selectedLeafHex,
					selectedOptionText:
						opt?.text ?? prev?.selectedOptionText ?? `${raw.selectedLeafHex.slice(0, 12)}…`,
					selectedLeafHex: raw.selectedLeafHex,
					visibility: raw.visibility,
					answeredAt: raw.answeredAt
				};
			})
			.sort((a, b) => b.answeredAt.localeCompare(a.answeredAt));
	}

	async hydrateAfterUnlock(rootPubkeyHex: string): Promise<void> {
		this.isHydrating = true;
		this.activeRootPubkey = rootPubkeyHex;
		try {
			const [, fieldsResult, responsesResult] = await Promise.allSettled([
				this.loadQuestionsFromRelay(rootPubkeyHex),
				araliyaService.getPrivateProfileFields(),
				araliyaService.listMyPrivateResponses()
			]);

			const nextProfile = createInitialProfile();
			if (fieldsResult.status === 'fulfilled') {
				for (const field of fieldsResult.value) {
					if (!isProfileFieldKey(field.key)) continue;
					nextProfile[field.key] = {
						...nextProfile[field.key],
						value: field.value,
						visibility: field.visibility,
						updatedAt: field.updatedAt
					};
				}
			}
			this.profile = nextProfile;

			if (responsesResult.status === 'fulfilled') {
				this.rawPrivateResponses = responsesResult.value;
			} else {
				this.rawPrivateResponses = [];
			}
			this.rebuildAnswers();

			await this.startLiveSync(rootPubkeyHex);
		} finally {
			this.isHydrating = false;
		}
	}

	async loadQuestionsFromRelay(rootPubkeyHex: string): Promise<void> {
		this.activeRootPubkey = rootPubkeyHex;
		this.isLoadingQuestions = true;
		this.loadError = null;
		try {
			this.questions = await araliyaService.listPublicQuestions(rootPubkeyHex);
			this.rebuildAnswers();
		} catch (err) {
			this.loadError =
				err instanceof Error ? err.message : 'Failed to load questions from relay';
		} finally {
			this.isLoadingQuestions = false;
		}
	}

	async refreshQuestionResults(questionCid: string): Promise<void> {
		const idx = this.questions.findIndex((q) => q.cid === questionCid);
		if (idx < 0) return;
		try {
			const counts = await araliyaService.getQuestionResults(
				questionCid,
				this.questions[idx].options
			);
			const updated = [...this.questions];
			updated[idx] = { ...updated[idx], communityCounts: counts };
			this.questions = updated;
		} catch {
			// Non-fatal if aggregates have not settled yet
		}
	}

	private resolvePublicDirectoryIdentity(
		userPubkey?: string,
		pseudonymLen = 8
	): { directoryHandle: string; publicDisplayName: string } {
		const usernamePublic =
			this.profile.username.visibility === 'public' &&
			this.profile.username.value.trim().length > 0;
		const directoryHandle = usernamePublic
			? this.profile.username.value.trim()
			: buildPseudonymousHandle(userPubkey ?? '', pseudonymLen);

		const namePublic =
			this.profile.realName.visibility === 'public' &&
			this.profile.realName.value.trim().length > 0;
		const publicDisplayName = namePublic
			? this.profile.realName.value.trim()
			: directoryHandle;

		return { directoryHandle, publicDisplayName };
	}

	private async syncPublicDirectoryRegistration(userPubkey?: string): Promise<void> {
		if (!this.profile.username.value.trim() && !userPubkey) return;
		const { directoryHandle, publicDisplayName } = this.resolvePublicDirectoryIdentity(userPubkey);
		await araliyaService
			.ensureRegisteredAndUpdateProfile(directoryHandle, publicDisplayName)
			.catch(() => {});
	}

	async saveUsername(
		username: string,
		keepPublic: boolean,
		pendingVouchToken?: string | null,
		userPubkey?: string
	): Promise<{ usedVouch: boolean; directoryHandle: string }> {
		const cleaned = username.trim().replace(/^@+/, '');
		let directoryHandle = keepPublic ? cleaned : buildPseudonymousHandle(userPubkey ?? '', 8);
		let publicDisplayName =
			keepPublic &&
			this.profile.realName.visibility === 'public' &&
			this.profile.realName.value.trim().length > 0
				? this.profile.realName.value.trim()
				: directoryHandle;

		let admission: { usedVouch: boolean };
		try {
			admission = await araliyaService.ensureRegisteredAndUpdateProfile(
				directoryHandle,
				publicDisplayName,
				pendingVouchToken
			);
		} catch (err) {
			const msg = err instanceof Error ? err.message.toLowerCase() : '';
			if (!keepPublic && (msg.includes('conflict') || msg.includes('already') || msg.includes('taken'))) {
				directoryHandle = buildPseudonymousHandle(userPubkey ?? '', 12);
				publicDisplayName = directoryHandle;
				admission = await araliyaService.ensureRegisteredAndUpdateProfile(
					directoryHandle,
					publicDisplayName,
					pendingVouchToken
				);
			} else {
				throw err;
			}
		}

		await araliyaService.setProfileField('username', cleaned, keepPublic);

		this.profile = {
			...this.profile,
			username: {
				...this.profile.username,
				value: cleaned,
				visibility: keepPublic ? 'public' : 'private',
				updatedAt: new Date().toISOString()
			}
		};
		return { usedVouch: admission.usedVouch, directoryHandle };
	}

	async saveIdentityDetails(
		details: {
			realName: string;
			realNamePublic: boolean;
			dob: string;
			dobPublic: boolean;
			pronouns: string;
			pronounsPublic: boolean;
		},
		userPubkey?: string
	): Promise<void> {
		const realName = details.realName.trim();
		const dob = details.dob.trim();
		const pronouns = details.pronouns.trim();

		await Promise.all([
			araliyaService.setProfileField('realName', realName, details.realNamePublic),
			araliyaService.setProfileField('dateOfBirth', dob, details.dobPublic),
			araliyaService.setProfileField('pronouns', pronouns, details.pronounsPublic)
		]);

		const now = new Date().toISOString();
		this.profile = {
			...this.profile,
			realName: {
				...this.profile.realName,
				value: realName,
				visibility: details.realNamePublic ? 'public' : 'private',
				updatedAt: now
			},
			dateOfBirth: {
				...this.profile.dateOfBirth,
				value: dob,
				visibility: details.dobPublic ? 'public' : 'private',
				updatedAt: now
			},
			pronouns: {
				...this.profile.pronouns,
				value: pronouns,
				visibility: details.pronounsPublic ? 'public' : 'private',
				updatedAt: now
			}
		};

		await this.syncPublicDirectoryRegistration(userPubkey);
	}

	async updateProfileFieldValue(
		key: ProfileFieldKey,
		value: string,
		userPubkey?: string
	): Promise<void> {
		const current = this.profile[key];
		const cleaned = key === 'username' ? value.trim().replace(/^@+/, '') : value.trim();
		await araliyaService.setProfileField(key, cleaned, current.visibility === 'public');

		this.profile = {
			...this.profile,
			[key]: {
				...current,
				value: cleaned,
				updatedAt: new Date().toISOString()
			}
		};

		if (key === 'username' || key === 'realName') {
			await this.syncPublicDirectoryRegistration(userPubkey);
		}
	}

	async toggleProfileFieldVisibility(
		key: ProfileFieldKey,
		userPubkey?: string
	): Promise<void> {
		const current = this.profile[key];
		const nextVisibility: FieldVisibility =
			current.visibility === 'public' ? 'private' : 'public';
		await araliyaService.setProfileField(
			key,
			current.value.trim(),
			nextVisibility === 'public'
		);

		this.profile = {
			...this.profile,
			[key]: {
				...current,
				visibility: nextVisibility,
				updatedAt: new Date().toISOString()
			}
		};

		if (key === 'username' || key === 'realName') {
			await this.syncPublicDirectoryRegistration(userPubkey);
		}
	}

	async createQuestion(
		text: string,
		answers: string[],
		rootPubkeyHex: string
	): Promise<{ cid: string; created: boolean }> {
		const cleanedText = text.trim();
		const cleanedAnswers = answers.map((a) => a.trim()).filter((a) => a.length > 0);
		if (!cleanedText) {
			throw new Error('Enter a question prompt.');
		}
		if (cleanedAnswers.length < 2) {
			throw new Error('Provide at least 2 answer choices.');
		}
		if (new Set(cleanedAnswers).size !== cleanedAnswers.length) {
			throw new Error('Answer choices must be unique.');
		}
		const out = await araliyaService.createPublicQuestion(cleanedText, cleanedAnswers);
		await this.loadQuestionsFromRelay(rootPubkeyHex);
		return out;
	}

	async submitAnswer(
		question: QuestionItem,
		optionId: string,
		keepPublic: boolean
	): Promise<void> {
		const option = question.options.find((o) => o.id === optionId);
		if (!option) return;

		await araliyaService.setAnswerVisibility(question.cid, option.leafHex, keepPublic);

		const now = new Date().toISOString();
		const nextRaw: RawPrivateResponse = {
			questionCid: question.cid,
			selectedLeafHex: option.leafHex,
			visibility: keepPublic ? 'public' : 'private',
			answeredAt: now
		};
		this.rawPrivateResponses = [
			nextRaw,
			...this.rawPrivateResponses.filter((r) => r.questionCid !== question.cid)
		];
		this.rebuildAnswers();

		if (keepPublic) {
			void this.refreshQuestionResults(question.cid);
		}
	}

	async toggleAnswerVisibility(questionCid: string): Promise<void> {
		const target = this.answers.find((a) => a.questionCid === questionCid);
		if (!target) return;

		const nextVisibility: FieldVisibility =
			target.visibility === 'public' ? 'private' : 'public';
		await araliyaService.setAnswerVisibility(
			target.questionCid,
			target.selectedLeafHex,
			nextVisibility === 'public'
		);

		const now = new Date().toISOString();
		this.rawPrivateResponses = this.rawPrivateResponses.map((r) =>
			r.questionCid === questionCid
				? { ...r, visibility: nextVisibility, answeredAt: now }
				: r
		);
		this.rebuildAnswers();
		void this.refreshQuestionResults(questionCid);
	}

	async startLiveSync(rootPubkeyHex: string): Promise<void> {
		this.activeRootPubkey = rootPubkeyHex;
		try {
			await araliyaService.startPublicQnaPoller(
				(batch) => this.handleEventBatch(batch),
				(err) => {
					console.warn('Event poller warning:', err);
				}
			);
			this.isLiveSyncActive = true;
		} catch (err) {
			this.isLiveSyncActive = false;
			console.warn('Could not start live QnA event poller:', err);
		}
	}

	stopLiveSync(): void {
		araliyaService.stopEventPoller();
		this.isLiveSyncActive = false;
	}

	private handleEventBatch(batch: QnaEventBatch): void {
		const events = batch?.domain_events ?? [];
		if (events.length === 0) return;

		let shouldReloadQuestions = false;
		const resultsToRefresh = new Set<string>();

		for (const ev of events) {
			if (ev.domain !== 'qna') continue;
			if (ev.kind === 'question_created' || ev.kind === 'question_redacted') {
				shouldReloadQuestions = true;
			} else if (ev.kind === 'results_updated' && Array.isArray(ev.resource_id)) {
				resultsToRefresh.add(bytesToHex(ev.resource_id));
			}
		}

		if (shouldReloadQuestions) {
			void this.loadQuestionsFromRelay(this.activeRootPubkey);
			return;
		}

		for (const cidHex of resultsToRefresh) {
			void this.refreshQuestionResults(cidHex);
		}
	}

	clearInMemoryState(): void {
		this.stopLiveSync();
		this.profile = createInitialProfile();
		this.answers = [];
		this.questions = [];
		this.rawPrivateResponses = [];
		this.loadError = null;
		this.isLoadingQuestions = false;
		this.isHydrating = false;
	}
}

export const ledgerStore = new LedgerStore();
