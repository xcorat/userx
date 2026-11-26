import type { OnboardingDemoQuestion, QuestionItem, QuestionOption } from '$lib/types';

export interface OnboardingManifestAnswer {
	id: string;
	text: string;
}

export interface OnboardingManifestQuestion {
	id: string;
	stage: string;
	text: string;
	answers: OnboardingManifestAnswer[];
	multiple: boolean;
	question_scope: 'pub' | 'prv' | 'group';
	default_response_visibility: 'public' | 'private' | 'local-only';
	relay_seed: boolean;
	skip_allowed: boolean;
	presentation: {
		mode: string;
		baseline_counts?: Record<string, number>;
		total_baseline_responses?: number;
		reference_url?: string;
		reference_summary?: string;
		reward?: {
			kind: 'demo-only';
			amount: number;
			unit: string;
		};
	};
}

export interface OnboardingManifestProfileField {
	id: 'username' | 'realName' | 'dateOfBirth' | 'pronouns';
	label: string;
	required: boolean;
	default_visibility: 'public' | 'private';
}

export interface OnboardingManifest {
	schema_version: 1;
	pack_id: string;
	questions: OnboardingManifestQuestion[];
	profile_fields: OnboardingManifestProfileField[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate the public manifest fetched from the relay before using it in onboarding UI. */
export function parseOnboardingManifest(value: unknown): OnboardingManifest {
	if (
		!isRecord(value) ||
		value.schema_version !== 1 ||
		typeof value.pack_id !== 'string' ||
		!Array.isArray(value.questions) ||
		!Array.isArray(value.profile_fields)
	) {
		throw new Error('Relay returned an unsupported onboarding manifest');
	}

	const questions = value.questions.map((raw): OnboardingManifestQuestion => {
		if (
			!isRecord(raw) ||
			typeof raw.id !== 'string' ||
			typeof raw.stage !== 'string' ||
			typeof raw.text !== 'string' ||
			typeof raw.multiple !== 'boolean' ||
			!['pub', 'prv', 'group'].includes(String(raw.question_scope)) ||
			!['public', 'private', 'local-only'].includes(
				String(raw.default_response_visibility)
			) ||
			typeof raw.relay_seed !== 'boolean' ||
			typeof raw.skip_allowed !== 'boolean' ||
			!Array.isArray(raw.answers) ||
			!isRecord(raw.presentation) ||
			typeof raw.presentation.mode !== 'string'
		) {
			throw new Error('Relay returned an invalid onboarding question');
		}

		const answers = raw.answers.map((answer): OnboardingManifestAnswer => {
			if (
				!isRecord(answer) ||
				typeof answer.id !== 'string' ||
				typeof answer.text !== 'string'
			) {
				throw new Error(`Relay returned an invalid answer for '${raw.id}'`);
			}
			return { id: answer.id, text: answer.text };
		});

		const presentation = raw.presentation;
		const baselineCounts = presentation.baseline_counts;
		if (
			baselineCounts !== undefined &&
			(!isRecord(baselineCounts) ||
				Object.values(baselineCounts).some(
					(count) => typeof count !== 'number' || !Number.isFinite(count) || count < 0
				))
		) {
			throw new Error(`Relay returned invalid baseline counts for '${raw.id}'`);
		}

		const reward = presentation.reward;
		if (
			reward !== undefined &&
			(!isRecord(reward) ||
				reward.kind !== 'demo-only' ||
				typeof reward.amount !== 'number' ||
				!Number.isFinite(reward.amount) ||
				typeof reward.unit !== 'string')
		) {
			throw new Error(`Relay returned invalid demo reward for '${raw.id}'`);
		}

		return {
			id: raw.id,
			stage: raw.stage,
			text: raw.text,
			answers,
			multiple: raw.multiple,
			question_scope: raw.question_scope as OnboardingManifestQuestion['question_scope'],
			default_response_visibility:
				raw.default_response_visibility as OnboardingManifestQuestion['default_response_visibility'],
			relay_seed: raw.relay_seed,
			skip_allowed: raw.skip_allowed,
			presentation: {
				mode: String(presentation.mode),
				baseline_counts: baselineCounts as Record<string, number> | undefined,
				total_baseline_responses:
					typeof presentation.total_baseline_responses === 'number'
						? presentation.total_baseline_responses
						: undefined,
				reference_url:
					typeof presentation.reference_url === 'string'
						? presentation.reference_url
						: undefined,
				reference_summary:
					typeof presentation.reference_summary === 'string'
						? presentation.reference_summary
						: undefined,
				reward: reward as OnboardingManifestQuestion['presentation']['reward']
			}
		};
	});

	const profileFields = value.profile_fields.map(
		(raw): OnboardingManifestProfileField => {
			if (
				!isRecord(raw) ||
				!['username', 'realName', 'dateOfBirth', 'pronouns'].includes(String(raw.id)) ||
				typeof raw.label !== 'string' ||
				typeof raw.required !== 'boolean' ||
				!['public', 'private'].includes(String(raw.default_visibility))
			) {
				throw new Error('Relay returned an invalid onboarding profile field');
			}
			return {
				id: raw.id as OnboardingManifestProfileField['id'],
				label: raw.label,
				required: raw.required,
				default_visibility:
					raw.default_visibility as OnboardingManifestProfileField['default_visibility']
			};
		}
	);

	return {
		schema_version: 1,
		pack_id: value.pack_id,
		questions,
		profile_fields: profileFields
	};
}

export function toOnboardingDemoQuestion(
	question: OnboardingManifestQuestion
): OnboardingDemoQuestion {
	return {
		text: question.text,
		options: question.answers.map(
			(answer): QuestionOption => ({
				id: answer.id,
				text: answer.text,
				leafHex: ''
			})
		),
		multiple: question.multiple,
		baselineCounts: question.presentation.baseline_counts ?? {},
		totalBaselineResponses: question.presentation.total_baseline_responses ?? 0,
		sponsoredRewardTokens: question.presentation.reward?.amount,
		referenceUrl: question.presentation.reference_url,
		referenceSummary: question.presentation.reference_summary
	};
}

/** Prefer a live public relay question with matching content; no CID is duplicated in UI code. */
export function findMatchingRelayQuestion(
	questions: QuestionItem[],
	demo: OnboardingDemoQuestion
): QuestionItem | null {
	const expectedOptions = new Set(demo.options.map((option) => option.text));
	return (
		questions.find(
			(question) =>
				question.text === demo.text &&
				(question.multiple === undefined || question.multiple === demo.multiple) &&
				question.options.length === demo.options.length &&
				question.options.every((option) => expectedOptions.has(option.text))
		) ?? null
	);
}
