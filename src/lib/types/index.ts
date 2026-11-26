/**
 * Core domain types for the `userx` application (wired to `araliya-net-wasm`).
 */

export type FieldVisibility = 'private' | 'public';

export type OnboardingStep =
	| 'unlock'
	| 'welcome'
	| 'keypair'
	| 'vouch'
	| 'vouch-expired'
	| 'handle'
	| 'custody'
	| 'details'
	| 'demo-public'
	| 'demo-sponsored'
	| 'ask-first'
	| 'feed';

export type AdmissionStatus = 'unknown' | 'admitted' | 'pending-vouch' | 'expired' | 'open';

export interface PendingVouchRequest {
	subjectPubkey: string;
	voucherPubkey: string | null;
	voucherHandle: string | null;
	createdAtMs: number;
	expiresAtMs: number;
	reason?: 'expired' | 'declined' | null;
}

export interface StagedOnboardingDraft {
	username: string;
	usernamePublic: boolean;
	realName: string;
	realNamePublic: boolean;
	dateOfBirth: string;
	dateOfBirthPublic: boolean;
	pronouns: string;
	pronounsPublic: boolean;
}

export interface VouchCertInfo {
	subjectPubkey: string;
	voucherPubkey: string;
	role: string;
	issuedAtMs: number;
	expiresAtMs: number | null;
	isValid: boolean;
	isExpired: boolean;
}

export interface IssuedVouchCard {
	cert: VouchCertInfo;
	vouchCardToken: string;
}

export interface VouchRequestItem {
	subjectPubkey: string;
	voucherPubkey: string;
	requestedHandle: string | null;
	createdAtMs: number;
	expiresAtMs: number;
	status: 'pending' | 'approved' | 'declined';
}

export type KeyCustodyMode =
	| 'browser-encrypted'
	| 'password-vault-wiped'
	| 'manual-no-store';

export type AppTab = 'feed' | 'users' | 'dashboard';

export interface DirectoryUser {
	userPubkeyHex: string;
	username: string;
	displayName: string;
	createdAtMs: number;
	updatedAtMs: number;
}

export interface PublicProfileField {
	key: string;
	value: string;
	updatedAt: string;
}

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

export type RelayBootstrapSource = 'http' | 'iroh-env' | 'iroh-manual' | 'none';

export interface ManualRelayOverride {
	endpointId: string;
	relayUrls: string[];
	rootPubkey: string;
}

export interface RelayStatusInfo {
	connected: boolean;
	source: RelayBootstrapSource;
	httpAvailable: boolean;
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
	multiple?: boolean;
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

export interface OnboardingDemoQuestion {
	text: string;
	options: QuestionOption[];
	multiple: boolean;
	baselineCounts: Record<string, number>;
	totalBaselineResponses: number;
	sponsoredRewardTokens?: number;
	referenceUrl?: string;
	referenceSummary?: string;
}

export interface VouchInspection {
	validFormat: boolean;
	format: 'token' | 'json' | 'invalid';
	tokenOrJson: string;
	subjectPubkey?: string;
	voucherPubkey?: string;
	expiresAtMs?: number | null;
	isValid?: boolean;
	isExpired?: boolean;
	role?: string;
	rootPubkey?: string;
	error?: string;
}

export type ThemeId = 'forest' | 'araliya' | 'obsidian' | 'solaris' | 'monolith';

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
