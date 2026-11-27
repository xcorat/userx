<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck, KeyRound } from 'lucide-svelte';

	let vouchPasteInput = $state('');
	let isChecking = $state(false);
	let isApplyingToken = $state(false);

	let req = $derived(sessionStore.pendingVouchRequest);
	let isDeclined = $derived(req?.reason === 'declined');
	let stagedUsername = $derived(ledgerStore.profile.username.value.trim());

	async function handleCheckRelayAgain() {
		isChecking = true;
		try {
			const res = await sessionStore.checkAndAutoCompleteVouch();
			if (res.admitted) {
				if (page.url.pathname !== '/') {
					goto('/');
				}
				return;
			}
			if (res.needsHandle) {
				sessionStore.setOnboardingStep('handle');
				toast.success('Vouch found! Pick your handle to complete signup.');
				return;
			}
			toast.info('No valid vouch found on the relay yet.');
		} finally {
			isChecking = false;
		}
	}

	async function handleApplyVouchToken(event: SubmitEvent) {
		event.preventDefault();
		if (!vouchPasteInput.trim()) return;
		isApplyingToken = true;
		try {
			const info = await araliyaService.inspectVouchTokenAsync(vouchPasteInput);
			if (!info.validFormat) {
				toast.error(info.error ?? 'Invalid vouch token');
				return;
			}
			if (info.isExpired) {
				toast.error('This vouch token has already expired.');
				return;
			}
			if (
				info.subjectPubkey &&
				sessionStore.identity?.userPubkey &&
				pubkeyToHex(info.subjectPubkey) !== pubkeyToHex(sessionStore.identity.userPubkey)
			) {
				toast.error('This vouch token belongs to a different public key.');
				return;
			}
			sessionStore.setPendingVouchToken(info.tokenOrJson);
			vouchPasteInput = '';
			const res = await sessionStore.checkAndAutoCompleteVouch(info.tokenOrJson);
			if (res.needsHandle) {
				sessionStore.setOnboardingStep('handle');
			}
		} finally {
			isApplyingToken = false;
		}
	}

	function handleRequestNewVouch() {
		sessionStore.restartVouchFlowFromExpired();
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill stepLabel="Vouch Expired" />

	<div class="my-auto space-y-5 py-2">
		<div class="space-y-2">
			<div class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400">
				<AlertTriangle class="h-5 w-5" />
			</div>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				{isDeclined ? 'Vouch Request Declined' : 'Vouch Request Expired'}
			</h1>
			<p class="text-xs leading-relaxed text-muted-foreground">
				{#if isDeclined}
					{req?.voucherHandle ? `@${req.voucherHandle}` : 'The selected member'} declined your vouch request. You'll need to ask another member to vouch for you to enter the network.
				{:else}
					Your 72-hour vouch request window ended before {req?.voucherHandle ? `@${req.voucherHandle}` : 'a member'} approved your identity. You'll need to ask another member to vouch for you.
				{/if}
			</p>
		</div>

		<div class="space-y-2 rounded-2xl border border-border/80 bg-card/85 p-4 text-xs">
			<div class="flex items-center gap-2 font-semibold text-foreground">
				<KeyRound class="h-4 w-4 text-primary" />
				Local Identity Preserved
			</div>
			<p class="leading-relaxed text-muted-foreground">
				Your encrypted keypair vault{stagedUsername ? ` and staged handle (@${stagedUsername})` : ''} remain safely stored on this device. Ask another member for a new invite link or vouch token—or pick a new voucher once member selection is enabled.
			</p>
		</div>

		<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4">
			<form onsubmit={handleApplyVouchToken} class="space-y-2.5">
				<div class="space-y-1">
					<Label for="expired-vouch-paste" class="text-xs">Have a Vouch Token or JSON?</Label>
					<Input
						id="expired-vouch-paste"
						bind:value={vouchPasteInput}
						placeholder="araliya-vouch-card:v1:..."
						autocapitalize="none"
						autocomplete="off"
						class="h-10 bg-background/70 font-mono text-xs"
					/>
				</div>
				<Button
					type="submit"
					variant="secondary"
					disabled={isApplyingToken}
					class="h-9 w-full cursor-pointer text-xs font-semibold"
				>
					<ShieldCheck class="mr-1.5 h-3.5 w-3.5" />
					{isApplyingToken ? 'Verifying…' : 'Apply Vouch Token & Finish'}
				</Button>
			</form>
		</div>
	</div>

	<div class="space-y-2 pb-2">
		<Button
			type="button"
			onclick={handleRequestNewVouch}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			Start a New Vouch Request
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
		<Button
			type="button"
			variant="outline"
			disabled={isChecking}
			onclick={handleCheckRelayAgain}
			class="h-10 w-full cursor-pointer text-xs"
		>
			<RefreshCw class={`mr-1.5 h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
			{isChecking ? 'Checking Relay…' : 'Check Relay Again'}
		</Button>
	</div>
</div>
