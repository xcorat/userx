<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { toast } from 'svelte-sonner';
	import { Clock, RefreshCw } from 'lucide-svelte';

	let nowMs = $state(Date.now());

	let req = $derived(sessionStore.pendingVouchRequest);

	let countdownLabel = $derived.by(() => {
		if (!req) return '';
		const diff = Math.max(0, req.expiresAtMs - nowMs);
		if (diff <= 0) return 'Expired';
		const totalMins = Math.floor(diff / 60_000);
		const hours = Math.floor(totalMins / 60);
		const mins = totalMins % 60;
		if (hours >= 24) {
			const days = Math.floor(hours / 24);
			const remHours = hours % 24;
			return `${days}d ${remHours}h ${mins}m`;
		}
		if (hours > 0) return `${hours}h ${mins}m`;
		const secs = Math.floor((diff % 60_000) / 1000);
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	});

	let targetLabel = $derived.by(() => {
		if (req?.voucherHandle) return `Waiting for @${req.voucherHandle}'s vouch`;
		if (req?.voucherPubkey) return 'Waiting for inviter vouch';
		return 'Pending human vouch';
	});

	onMount(() => {
		const timer = setInterval(() => {
			nowMs = Date.now();
		}, 15_000);
		return () => clearInterval(timer);
	});

	async function handleCheckNow() {
		const res = await sessionStore.checkAndAutoCompleteVouch();
		if (!res.admitted && !sessionStore.isVouchExpired) {
			toast.info('Still waiting for your vouch approval.');
		}
	}

	function openVouchDetails() {
		sessionStore.setOnboardingStep('vouch');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}
</script>

<div class="flex shrink-0 items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
	<div class="flex min-w-0 items-center gap-1.5">
		<Clock class="h-3.5 w-3.5 shrink-0 text-amber-400" />
		<span class="truncate font-medium text-foreground">{targetLabel}</span>
		{#if countdownLabel}
			<span class="shrink-0 font-mono text-xs text-amber-300">· {countdownLabel}</span>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-1.5">
		<button
			type="button"
			disabled={sessionStore.isCheckingVouch}
			onclick={handleCheckNow}
			class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/35 bg-background/70 px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-background"
		>
			<RefreshCw class={`h-2.5 w-2.5 ${sessionStore.isCheckingVouch ? 'animate-spin' : ''}`} />
			Check
		</button>
		<button
			type="button"
			onclick={openVouchDetails}
			class="cursor-pointer rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
		>
			Vouch
		</button>
	</div>
</div>
