import type { OnboardingDemoQuestion, QuestionItem } from '$lib/types';

/**
 * Canonical default onboarding walkthrough questions.
 * Precomputed `qa-cid/v1` hashes match `araliya-net-qna/src/crypto.rs`
 * and `/data/p2p/araliya-net/data/seed_qna.json`.
 */

export const DEFAULT_PUBLIC_DEMO_QUESTION: OnboardingDemoQuestion = {
	cid: 'c01e9b3a1c6a79157885b9f18bf7dbbeb181f586b1e8e18a7c0a419ccd7277c1',
	text: 'Pepsi or Coke?',
	options: [
		{
			id: 'opt_0',
			text: 'Pepsi',
			leafHex: '23ccd4d9bd2d8b8958aecf6420dc17f58ab97dcfbc8006c85de56dbc1eb18902'
		},
		{
			id: 'opt_1',
			text: 'Coke',
			leafHex: 'd570abfdf8ee912e76249a978065c21fe4312ee951fd517a7f4db2650e86a1f8'
		},
		{
			id: 'opt_2',
			text: 'No preference',
			leafHex: '2a67a79824684ecaab1e9e61da37503d510610e8775446a3375b7fb71a593c17'
		}
	],
	baselineCounts: {
		opt_0: 582,
		opt_1: 667,
		opt_2: 171
	},
	totalBaselineResponses: 1420
};

export const DEFAULT_SPONSORED_DEMO_QUESTION: OnboardingDemoQuestion = {
	cid: 'a8137065df373767c59d8a62acdde5da296af83202b97ed4f29c3d328a3c5963',
	text: "We don't need nukes.",
	options: [
		{
			id: 'opt_0',
			text: 'Agree',
			leafHex: '25615d7ca12bb1808085861f7fed341af76d1c32a859547a85a39cdd82f152fc'
		},
		{
			id: 'opt_1',
			text: 'Disagree',
			leafHex: '7882cb9ea4c2916c7baa0ad7ed677d97987cd3a2ca6f23a5d28d71a6dd6386eb'
		}
	],
	baselineCounts: {
		opt_0: 518,
		opt_1: 374
	},
	totalBaselineResponses: 892,
	sponsoredRewardTokens: 1,
	referenceUrl: 'https://www.icanw.org/nuclear_weapons_facts',
	referenceSummary:
		'Background context on global nuclear deterrence, disarmament treaties, and humanitarian risk.'
};

export const ONBOARDING_DEMO_QUESTIONS: OnboardingDemoQuestion[] = [
	DEFAULT_PUBLIC_DEMO_QUESTION,
	DEFAULT_SPONSORED_DEMO_QUESTION
];

/**
 * Locate the live relay question corresponding to a canonical onboarding demo question.
 * Prefers exact `qa-cid/v1` match, falling back to exact question text and option set match.
 */
export function findMatchingRelayQuestion(
	questions: QuestionItem[],
	demo: OnboardingDemoQuestion
): QuestionItem | null {
	const byCid = questions.find((q) => q.cid.toLowerCase() === demo.cid.toLowerCase());
	if (byCid) return byCid;

	const expectedOptions = new Set(demo.options.map((o) => o.text));
	return (
		questions.find(
			(q) =>
				q.text === demo.text &&
				q.options.length === demo.options.length &&
				q.options.every((o) => expectedOptions.has(o.text))
		) ?? null
	);
}
