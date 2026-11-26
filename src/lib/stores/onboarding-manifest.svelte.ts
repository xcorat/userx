import type {
	OnboardingManifest,
	OnboardingManifestProfileField,
	OnboardingManifestQuestion
} from '$lib/config/onboarding.manifest';

let manifest = $state<OnboardingManifest | null>(null);
let error = $state<string | null>(null);

export const onboardingManifestStore = {
	get manifest() {
		return manifest;
	},
	get error() {
		return error;
	},
	setManifest(value: OnboardingManifest | null) {
		manifest = value;
		error = null;
	},
	setError(message: string | null) {
		manifest = null;
		error = message;
	},
	question(id: string): OnboardingManifestQuestion | null {
		return manifest?.questions.find((question) => question.id === id) ?? null;
	},
	profileField(id: OnboardingManifestProfileField['id']): OnboardingManifestProfileField | null {
		return manifest?.profile_fields.find((field) => field.id === id) ?? null;
	}
};
