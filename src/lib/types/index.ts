/**
 * Core domain types for the `userx` application (wired to `araliya-net-wasm`).
 */

export type FieldVisibility = 'private' | 'public';

export type OnboardingStep =
	| 'login'
	| 'manifesto'
	| 'username'
	| 'identity'
	| 'theme'
	| 'feed';

export type AppTab = 'feed' | 'dashboard';

export type ProfileFieldKey = 'username' | 'realName' | 'dateOfBirth' | 'pronouns';

export interface UserIdentity {
	userPubkey: string;
	x25519Pubkey: string;
	transportPeerId: string;
}

export interface GeneratedKeypair {
	secretKey: string;
	publicKey: string;
	x25519Pubkey: string;
}

export interface RecoveryPayload {
	publicKey: string;
	recoveryKey: string;
	secretKey: string;
}

export interface RelayStatusInfo {
	connected: boolean;
	baseUrl: string;
	endpointId: string;
	dialPeerAddress: string;
	relayUrls: string[];
	rootPubkey: string;
	alpns: string[];
	localOnly: boolean;
	devWriteEnabled: boolean;
	genesisMode: boolean;
	admissionPolicy: string;
	error?: string;
}

export interface ProfileField {
	key: ProfileFieldKey;
	label: string;
	value: string;
	visibility: FieldVisibility;
	required: boolean;
	updatedAt: string;
}

export interface QuestionOption {
	id: string;
	text: string;
	leafHex: string;
}

export interface QuestionItem {
	cid: string;
	text: string;
	options: QuestionOption[];
	ownerType: 'genesis' | 'community';
	authorPubkeyHex: string;
	authorHandle: string;
	scope: 'pub' | 'prv' | 'group';
	defaultPublic: boolean;
	communityCounts: Record<string, number>;
}

export interface AnsweredQuestionRecord {
	questionCid: string;
	questionText: string;
	ownerType: 'genesis' | 'community';
	selectedOptionId: string;
	selectedOptionText: string;
	selectedLeafHex: string;
	visibility: FieldVisibility;
	answeredAt: string;
}

export type ThemeId = 'obsidian' | 'solaris' | 'araliya' | 'monolith';

export type ThemeDecoration = 'grid' | 'editorial' | 'aura' | 'minimal';

export interface ThemeSwatches {
	bg: string;
	card: string;
	primary: string;
	accent: string;
	fg: string;
}

export interface ThemeConfig {
	id: ThemeId;
	name: string;
	description: string;
	fontFamily: string;
	headingFont: string;
	decoration: ThemeDecoration;
	swatches: ThemeSwatches;
	cssVars: Record<string, string>;
}
