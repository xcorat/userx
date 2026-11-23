<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte';
	import LoginVouchScreen from '$lib/components/onboarding/LoginVouchScreen.svelte';
	import ManifestoScreen from '$lib/components/onboarding/ManifestoScreen.svelte';
	import UsernameScreen from '$lib/components/onboarding/UsernameScreen.svelte';
	import PersonalDetailsScreen from '$lib/components/onboarding/PersonalDetailsScreen.svelte';
	import ThemePickerScreen from '$lib/components/onboarding/ThemePickerScreen.svelte';
	import QuestionFeed from '$lib/components/feed/QuestionFeed.svelte';
	import UserDashboard from '$lib/components/dashboard/UserDashboard.svelte';
	import { RefreshCw } from 'lucide-svelte';

	let step = $derived(
		!sessionStore.isLoggedIn ? 'login' : sessionStore.onboardingStep
	);
</script>

{#if !sessionStore.isInitialized}
	<div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
		<RefreshCw class="h-6 w-6 animate-spin text-primary" />
		<p class="font-mono text-xs text-muted-foreground">Restoring encrypted vault…</p>
	</div>
{:else if step === 'login'}
	<LoginVouchScreen />
{:else if step === 'manifesto'}
	<ManifestoScreen />
{:else if step === 'username'}
	<UsernameScreen />
{:else if step === 'identity'}
	<PersonalDetailsScreen />
{:else if step === 'theme'}
	<ThemePickerScreen />
{:else if sessionStore.activeTab === 'dashboard'}
	<UserDashboard />
{:else}
	<QuestionFeed />
{/if}
