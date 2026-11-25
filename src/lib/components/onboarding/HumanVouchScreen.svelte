<script lang="ts">
	import { onMount } from 'svelte';
	import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import {
		ArrowRight,
		CheckCircle2,
		Copy,
		Send,
		ShieldCheck,
		Terminal,
		UserCheck
	} from 'lucide-svelte';

	let vouchPasteInput = $state('');
	let isRequestingGenesis = $state(false);
	let showMaintainerRequest = $state(false);
	let resolvedVoucherHandle = $state<string | null>(null);
	let mismatchWarning = $state<string | null>(null);

	let relay = $derived(sessionStore.relayStatus);
	let pubkey = $derived(sessionStore.identity?.userPubkey ?? '');
	let stagedToken = $derived(sessionStore.pendingVouchToken);

	let displayVoucherHandle = $derived(
		resolvedVoucherHandle ??
			sessionStore.vouchedByHandle ??
			sessionStore.pendingVouchInviter ??
			'user-x'
	);

	function truncateToken(val: string): string {
		if (!val || val.length <= 28) return val;
		return `${val.slice(0, 22)}…${val.slice(-6)}`;
	}

	function buildVouchRequestPayload(pk: string): string {
		return JSON.stringify(
			{
				type: 'araliya-vouch-request/v1',
				subject_pubkey: pk,
				subject_pubkey_hex: pubkeyToHex(pk),
				relay_endpoint: relay?.endpointId || undefined
			},
			null,
			2
		);
	}

	function buildGenesisCurl(pk: string): string {
		return `curl -s -X POST http://127.0.0.1:8080/genesis/vouch -H 'Content-Type: application/json' -d '{"subject_pubkey":"${pk}","ttl_secs":86400}'`;
	}

	async function inspectAndResolveVoucher(token: string) {
		mismatchWarning = null;
		const info = araliyaService.inspectVouchToken(token);
		if (!info.validFormat) return;

		if (
			info.subjectPubkey &&
			pubkey &&
			pubkeyToHex(info.subjectPubkey) !== pubkeyToHex(pubkey)
		) {
			mismatchWarning =
				'Warning: this vouch token targets a different public key than your active identity.';
		}

		if (info.voucherPubkey) {
			if (
				relay?.rootPubkey &&
				pubkeyToHex(info.voucherPubkey) === pubkeyToHex(relay.rootPubkey)
			) {
				resolvedVoucherHandle = 'genesis';
				sessionStore.setVouchedByHandle('genesis');
				return;
			}
			if (relay?.connected && araliyaService.hasUnlockedWasmSession()) {
				try {
					const user = await araliyaService.getUserByPubkey(info.voucherPubkey);
					if (user?.username) {
						resolvedVoucherHandle = user.username;
						sessionStore.setVouchedByHandle(user.username);
						return;
					}
				} catch {
					// Keep fallback handle
				}
			}
		}
	}

	async function tryAutoGenesisVouch() {
		if (
			sessionStore.pendingVouchToken ||
			!relay?.connected ||
			!relay.httpAvailable ||
			!relay.genesisMode ||
			!pubkey ||
			isRequestingGenesis
		) {
			return;
		}
		isRequestingGenesis = true;
		try {
			const token = await araliyaService.requestGenesisVouch(pubkey, relay.baseUrl);
			sessionStore.setPendingVouchToken(token);
			sessionStore.setVouchedByHandle('genesis');
			resolvedVoucherHandle = 'genesis';
		} catch {
			// Fall back to State B manual paste / request flow
		} finally {
			isRequestingGenesis = false;
		}
	}

	onMount(() => {
		if (stagedToken) {
			void inspectAndResolveVoucher(stagedToken);
		} else {
			void tryAutoGenesisVouch();
		}
	});

	$effect(() => {
		if (!stagedToken && relay?.connected && relay.httpAvailable && relay.genesisMode && pubkey) {
			void tryAutoGenesisVouch();
		}
	});

	async function handleApplyVouch(event: SubmitEvent) {
		event.preventDefault();
		const info = araliyaService.inspectVouchToken(vouchPasteInput);
		if (!info.validFormat) {
			toast.error(info.error ?? 'Invalid vouch token');
			return;
		}
		sessionStore.setPendingVouchToken(info.tokenOrJson);
		vouchPasteInput = '';
		await inspectAndResolveVoucher(info.tokenOrJson);
		toast.success('Vouch token staged for registration');
	}

	async function handleSendVouchRequest() {
		showMaintainerRequest = true;
		if (!pubkey) return;
		try {
			await navigator.clipboard.writeText(buildVouchRequestPayload(pubkey));
			toast.success('Copied vouch request payload with your Public Key');
		} catch {
			toast.info('Share the vouch request payload below with a relay maintainer');
		}
	}

	async function copyText(label: string, value: string) {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill
		stepLabel="04 / 10"
		onBack={() => sessionStore.setOnboardingStep('keypair')}
	/>

	<div class="my-auto space-y-5 py-2">
		<div class="space-y-1.5">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 2 · Join araliya-net
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Human Vouch Admission
			</h1>
			<p class="text-xs leading-relaxed text-muted-foreground">
				To keep the commons human without invasive ID checks, an existing member must vouch for you.
			</p>
		</div>

		{#if isRequestingGenesis}
			<div class="rounded-2xl border border-primary/30 bg-card/85 p-4 text-center text-xs text-muted-foreground">
				Requesting Genesis relay vouch for your public key…
			</div>
		{:else if stagedToken}
			<!-- State A — Arriving via Invite Link / Genesis Vouch -->
			<div class="space-y-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="h-5 w-5 shrink-0 text-primary" />
						<span class="text-xs font-semibold text-foreground">Vouch Ready</span>
					</div>
					<button
						type="button"
						onclick={() => {
							sessionStore.clearPendingVouch();
							resolvedVoucherHandle = null;
							mismatchWarning = null;
						}}
						class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
					>
						Use different token
					</button>
				</div>

				<div class="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 font-mono text-[11px]">
					<span class="truncate text-foreground">{truncateToken(stagedToken)}</span>
					<button
						type="button"
						onclick={() => copyText('vouch token', stagedToken)}
						aria-label="Copy vouch token"
						class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
					>
						<Copy class="h-3.5 w-3.5" />
					</button>
				</div>

				<p class="text-xs leading-relaxed text-foreground">
					<UserCheck class="mr-1 inline h-3.5 w-3.5 text-primary" />
					You have been accepted to the network by the recommendation of
					<span class="font-semibold text-primary">@{displayVoucherHandle}</span>!
				</p>

				{#if mismatchWarning}
					<p class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-200">
						{mismatchWarning}
					</p>
				{/if}
			</div>
		{:else}
			<!-- State B — No Invite Link Yet -->
			<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4">
				<p class="text-xs leading-relaxed text-muted-foreground">
					Paste a vouch token if you have one, or send a vouch request to a relay maintainer:
				</p>

				<form onsubmit={handleApplyVouch} class="space-y-2.5">
					<div class="space-y-1">
						<Label for="vouch-paste-input" class="text-[11px]">Vouch Token or JSON</Label>
						<Input
							id="vouch-paste-input"
							bind:value={vouchPasteInput}
							placeholder="araliya-vouch-card:v1:..."
							autocapitalize="none"
							autocomplete="off"
							class="h-10 bg-background/70 font-mono text-xs"
						/>
					</div>
					<Button type="submit" variant="secondary" class="h-9 w-full cursor-pointer text-xs font-semibold">
						<ShieldCheck class="mr-1.5 h-3.5 w-3.5" />
						Apply Vouch Token
					</Button>
				</form>

				<div class="border-t border-border/60 pt-2.5">
					<Button
						type="button"
						variant="outline"
						onclick={handleSendVouchRequest}
						class="h-9 w-full cursor-pointer text-xs"
					>
						<Send class="mr-1.5 h-3.5 w-3.5 text-primary" />
						Send Vouch Request to Relay Maintainer
					</Button>
				</div>

				{#if showMaintainerRequest && pubkey}
					<div class="space-y-2 rounded-xl border border-border/70 bg-background/75 p-3 text-[11px]">
						<div class="flex items-center justify-between gap-2">
							<span class="flex items-center gap-1.5 font-semibold text-foreground">
								<Terminal class="h-3.5 w-3.5 text-primary" />
								Your Vouch Request Details
							</span>
							<button
								type="button"
								onclick={() => copyText('genesis curl command', buildGenesisCurl(pubkey))}
								class="inline-flex cursor-pointer items-center gap-1 text-[10px] text-primary hover:underline"
							>
								<Copy class="h-3 w-3" />
								Copy curl
							</button>
						</div>
						<p class="text-[10px] text-muted-foreground">
							Share your Public Key with a relay maintainer or existing member to mint your <span class="font-mono">araliya-vouch-card:v1</span>:
						</p>
						<div class="flex items-center justify-between gap-2 rounded-md bg-card px-2 py-1.5 font-mono text-[10px]">
							<span class="truncate text-foreground">{pubkey}</span>
							<button
								type="button"
								onclick={() => copyText('public key', pubkey)}
								class="shrink-0 cursor-pointer text-primary hover:underline"
							>
								Copy
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="space-y-2 pb-2">
		{#if stagedToken}
			<Button
				onclick={() => sessionStore.setOnboardingStep('handle')}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Enter the Network
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else if relay?.admissionPolicy === 'open'}
			<Button
				onclick={() => sessionStore.setOnboardingStep('handle')}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Open Relay · Enter the Network
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else}
			<Button
				onclick={() => sessionStore.setOnboardingStep('handle')}
				variant="outline"
				size="lg"
				class="h-11 w-full cursor-pointer text-xs font-semibold"
			>
				Continue Without Vouch (Open Relays Only)
				<ArrowRight class="ml-2 h-3.5 w-3.5" />
			</Button>
		{/if}
	</div>
</div>
