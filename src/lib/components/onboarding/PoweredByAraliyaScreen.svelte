<script lang="ts">
	import { swipe } from '$lib/actions/swipe';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, Network, Server, ShieldCheck } from 'lucide-svelte';

	let dragOffsetX = $state(0);
	let isDragging = $state(false);
	let relay = $derived(sessionStore.relayStatus);

	function handleNext() {
		sessionStore.setOnboardingStep('keypair');
	}

	function handleBack() {
		sessionStore.setOnboardingStep('welcome');
	}
</script>

<div
	class="flex h-full flex-col justify-between overflow-y-auto px-5 py-6 select-none"
	use:swipe={{
		onStart: () => {
			isDragging = true;
		},
		onMove: ({ dx }) => {
			dragOffsetX = Math.min(0, Math.max(-140, dx));
		},
		onEnd: ({ dx }) => {
			isDragging = false;
			if (dx < -75) {
				dragOffsetX = 0;
				handleNext();
			} else {
				dragOffsetX = 0;
			}
		}
	}}
	style={`transform: translateX(${dragOffsetX * 0.35}px); transition: ${
		isDragging ? 'none' : 'transform 220ms ease-out'
	};`}
>
	<RelayStatusPill stepLabel="02 / 10" onBack={handleBack} />

	<div class="my-auto space-y-5 py-6">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
			<Network class="h-3.5 w-3.5" />
			Stage 1 · Powered by araliya-net
		</div>

		<div class="space-y-3">
			<h1 class="font-heading text-2xl leading-tight font-bold tracking-tight text-foreground">
				No central servers. No corporate landlords.
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				Built on <span class="font-semibold text-foreground">araliya-net</span> (powered by
				<span class="font-mono text-primary">iroh</span>), your device connects directly to peer storage relays using cryptographic links—no static IP address or hosting provider needed. Anyone with an internet connection can host data and run their own modular relay.
			</p>
		</div>

		<div class="space-y-2.5 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-md">
			<div class="flex items-center justify-between gap-2">
				<span class="flex items-center gap-2 text-xs font-semibold text-foreground">
					<Server class="h-4 w-4 text-primary" />
					Peer Storage Relay Link
				</span>
				<span
					class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
						relay?.connected
							? 'bg-emerald-500/15 text-emerald-300'
							: 'bg-secondary text-muted-foreground'
					}`}
				>
					<ShieldCheck class="h-3 w-3" />
					{relay?.connected ? 'QUIC / Iroh Ready' : 'Configure Above'}
				</span>
			</div>

			<p class="truncate font-mono text-[11px] text-muted-foreground">
				{relay?.endpointId
					? `peer: ${relay.endpointId}`
					: 'Tap the relay settings gear above to specify a custom EndpointId.'}
			</p>
		</div>
	</div>

	<div class="pb-2" data-no-drag>
		<Button
			onclick={handleNext}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			Create Your Identity
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</div>
