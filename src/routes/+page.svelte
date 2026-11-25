<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte';
	import UnlockRecoverScreen from '$lib/components/onboarding/UnlockRecoverScreen.svelte';
	import WelcomeCommonsScreen from '$lib/components/onboarding/WelcomeCommonsScreen.svelte';
	import PoweredByAraliyaScreen from '$lib/components/onboarding/PoweredByAraliyaScreen.svelte';
	import KeypairCustodyScreen from '$lib/components/onboarding/KeypairCustodyScreen.svelte';
	import HumanVouchScreen from '$lib/components/onboarding/HumanVouchScreen.svelte';
	import ClaimHandleScreen from '$lib/components/onboarding/ClaimHandleScreen.svelte';
	import StorageCustodyScreen from '$lib/components/onboarding/StorageCustodyScreen.svelte';
	import PersonalDetailsPreviewScreen from '$lib/components/onboarding/PersonalDetailsPreviewScreen.svelte';
	import PublicQuestionDemoScreen from '$lib/components/onboarding/PublicQuestionDemoScreen.svelte';
	import SponsoredQuestionDemoScreen from '$lib/components/onboarding/SponsoredQuestionDemoScreen.svelte';
	import AskFirstQuestionScreen from '$lib/components/onboarding/AskFirstQuestionScreen.svelte';
	import QuestionFeed from '$lib/components/feed/QuestionFeed.svelte';
	import UserDashboard from '$lib/components/dashboard/UserDashboard.svelte';
	import { RefreshCw } from 'lucide-svelte';

	let step = $derived.by(() => {
		if (!sessionStore.isLoggedIn) {
			if (
				sessionStore.wantsUnlockScreen ||
				(sessionStore.hasVault &&
					!['welcome', 'network', 'keypair'].includes(sessionStore.onboardingStep))
			) {
				return 'unlock';
			}
			if (sessionStore.onboardingStep === 'network') return 'network';
			if (sessionStore.onboardingStep === 'keypair') return 'keypair';
			return 'welcome';
		}
		return sessionStore.onboardingStep;
	});
</script>

{#if !sessionStore.isInitialized}
	<div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
		<RefreshCw class="h-6 w-6 animate-spin text-primary" />
		<p class="font-mono text-xs text-muted-foreground">Restoring encrypted session…</p>
	</div>
{:else if step === 'unlock'}
	<UnlockRecoverScreen />
{:else if step === 'welcome'}
	<WelcomeCommonsScreen />
{:else if step === 'network'}
	<PoweredByAraliyaScreen />
{:else if step === 'keypair'}
	<KeypairCustodyScreen />
{:else if step === 'vouch'}
	<HumanVouchScreen />
{:else if step === 'handle'}
	<ClaimHandleScreen />
{:else if step === 'custody'}
	<StorageCustodyScreen />
{:else if step === 'details'}
	<PersonalDetailsPreviewScreen />
{:else if step === 'demo-public'}
	<PublicQuestionDemoScreen />
{:else if step === 'demo-sponsored'}
	<SponsoredQuestionDemoScreen />
{:else if step === 'ask-first'}
	<AskFirstQuestionScreen />
{:else if sessionStore.activeTab === 'dashboard'}
	<UserDashboard />
{:else}
	<QuestionFeed />
{/if}
