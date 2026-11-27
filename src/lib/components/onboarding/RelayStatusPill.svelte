<script lang="ts">
	import { loadManualRelayOverride } from '$lib/config/genesis.config';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { AlertTriangle, ArrowLeft, RefreshCw, Settings } from 'lucide-svelte';

	interface Props {
		showBrand?: boolean;
		stepLabel?: string;
		onBack?: () => void;
	}

	let { showBrand = false, stepLabel, onBack }: Props = $props();

	const initialOverride = loadManualRelayOverride();
	let showRelayConfig = $state(false);
	let relayEndpointInput = $state(initialOverride?.endpointId ?? '');
	let relayUrlsInput = $state(initialOverride?.relayUrls.join(', ') ?? '');
	let rootPubkeyInput = $state(initialOverride?.rootPubkey ?? '');

	let relay = $derived(sessionStore.relayStatus);

	function truncateKey(key: string): string {
		if (!key || key.length <= 18) return key || '—';
		return `${key.slice(0, 8)}…${key.slice(-6)}`;
	}

	async function handleSaveRelayOverride(event: SubmitEvent) {
		event.preventDefault();
		const status = await sessionStore.setManualRelayOverride(
			relayEndpointInput,
			relayUrlsInput,
			rootPubkeyInput
		);
		if (status.connected) {
			showRelayConfig = false;
			toast.success(`Connected via Iroh (${truncateKey(status.endpointId)})`);
		} else {
			toast.error(status.error ?? 'Failed to reach relay endpoint');
		}
	}

	async function handleResetRelayOverride() {
		relayEndpointInput = '';
		relayUrlsInput = '';
		rootPubkeyInput = '';
		const status = await sessionStore.clearManualRelayOverride();
		if (status.connected) {
			showRelayConfig = false;
			toast.success(
				status.httpAvailable
					? 'Connected via HTTP bootstrap'
					: 'Connected via default Iroh endpoint'
			);
		} else {
			toast.info(status.error ?? 'Cleared manual relay override');
		}
	}
</script>

<header class="space-y-2 pt-1">
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			{#if showBrand}
				<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
					ux
				</span>
				<span class="font-heading text-base font-bold tracking-tight">userx</span>
			{:else if onBack}
				<button
					type="button"
					onclick={onBack}
					class="inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft class="h-3.5 w-3.5" />
					Back
				</button>
			{/if}

			{#if stepLabel}
				<span class="rounded-full border border-border/80 bg-secondary/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
					{stepLabel}
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => sessionStore.refreshRelayStatus()}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card/85 px-2.5 py-1 font-mono text-xs transition-colors hover:border-primary/40"
			>
				<span
					class={`h-2 w-2 rounded-full ${
						relay?.connected ? 'bg-primary' : 'bg-destructive'
					}`}
				></span>
				{relay?.connected
					? relay.httpAvailable
						? 'Relay Connected'
						: 'Iroh Connected'
					: 'Relay Offline'}
				<RefreshCw
					class={`h-3 w-3 text-muted-foreground ${
						sessionStore.isConnectingRelay ? 'animate-spin' : ''
					}`}
				/>
			</button>

			<button
				type="button"
				onclick={() => (showRelayConfig = !showRelayConfig)}
				aria-label="Configure Relay Endpoint"
				title="Configure Relay Endpoint"
				class={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card/85 transition-colors ${
					showRelayConfig
						? 'border-primary/60 text-primary'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<Settings class="h-3.5 w-3.5" />
			</button>
		</div>
	</div>

	{#if relay?.connected && relay.localOnly}
		<div class="flex items-start gap-2 rounded-lg border border-warning/35 bg-warning/10 px-2.5 py-2 text-xs text-warning">
			<AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
			<span>
				Relay is running with <span class="font-mono">--local-only</span>; browser WASM requires Iroh relay connectivity.
			</span>
		</div>
	{:else if !relay?.connected && relay?.error && showRelayConfig}
		<p class="text-xs text-destructive">{relay.error}</p>
	{/if}

	{#if showRelayConfig}
		<form
			onsubmit={handleSaveRelayOverride}
			class="space-y-2 rounded-xl border border-border bg-card/95 p-3 text-xs backdrop-blur-md"
		>
			<div class="flex items-center justify-between">
				<span class="font-semibold">Direct Iroh Relay Override</span>
				<span class="font-mono text-xs text-muted-foreground">
					mode: {relay?.source ?? 'none'}
				</span>
			</div>
			{#if relay?.endpointId}
				<p class="truncate font-mono text-xs text-muted-foreground">
					active: {truncateKey(relay.endpointId)}
				</p>
			{/if}
			<div class="space-y-1">
				<Label for="relay-endpoint-input" class="text-xs text-muted-foreground">
					EndpointId or versioned iroh1 address
				</Label>
				<Input
					id="relay-endpoint-input"
					bind:value={relayEndpointInput}
					placeholder="EndpointId or iroh1: address"
					autocapitalize="none"
					autocomplete="off"
					class="h-8 bg-background/70 font-mono text-xs"
				/>
			</div>
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1">
					<Label for="relay-urls-input" class="text-xs text-muted-foreground">
						Iroh Relay URLs
					</Label>
					<Input
						id="relay-urls-input"
						bind:value={relayUrlsInput}
						placeholder="https://..."
						autocapitalize="none"
						autocomplete="off"
						class="h-8 bg-background/70 font-mono text-xs"
					/>
				</div>
				<div class="space-y-1">
					<Label for="relay-root-input" class="text-xs text-muted-foreground">
						Root Pubkey
					</Label>
					<Input
						id="relay-root-input"
						bind:value={rootPubkeyInput}
						placeholder="hex or base64url"
						autocapitalize="none"
						autocomplete="off"
						class="h-8 bg-background/70 font-mono text-xs"
					/>
				</div>
			</div>
			<div class="flex gap-2 pt-0.5">
				<Button
					type="submit"
					size="sm"
					disabled={sessionStore.isConnectingRelay}
					class="h-7 flex-1 cursor-pointer text-xs"
				>
					{sessionStore.isConnectingRelay ? 'Probing Iroh...' : 'Save & Connect'}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onclick={handleResetRelayOverride}
					disabled={sessionStore.isConnectingRelay}
					class="h-7 cursor-pointer text-xs"
				>
					Reset
				</Button>
			</div>
		</form>
	{/if}
</header>
