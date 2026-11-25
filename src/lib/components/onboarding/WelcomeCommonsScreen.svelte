<script lang="ts">
	import { swipe } from '$lib/actions/swipe';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, KeyRound, Sprout } from 'lucide-svelte';

	let dragOffsetX = $state(0);
	let isDragging = $state(false);

	function handleNext() {
		sessionStore.setOnboardingStep('network');
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
	<RelayStatusPill showBrand stepLabel="01 / 10" />

	<div class="my-auto space-y-6 py-6">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
			<Sprout class="h-3.5 w-3.5" />
			Stage 1 · Welcome to the Digital Commons
		</div>

		<div class="space-y-4">
			<h1 class="font-heading text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl">
				Digital Gardeners: Own your data, your attention, and your work.
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				On traditional platforms, your answers train someone else's algorithms and your attention is sold to advertisers. Here, you own your identity, your data, and the value of your choices.
			</p>
		</div>

		<div class="grid grid-cols-3 gap-2 pt-1 text-center">
			<div class="rounded-xl border border-border/70 bg-card/70 px-2 py-2.5">
				<p class="text-xs font-semibold text-foreground">Identity</p>
				<p class="mt-0.5 text-[10px] text-muted-foreground">Self-sovereign keys</p>
			</div>
			<div class="rounded-xl border border-border/70 bg-card/70 px-2 py-2.5">
				<p class="text-xs font-semibold text-foreground">Privacy</p>
				<p class="mt-0.5 text-[10px] text-muted-foreground">Encrypted at rest</p>
			</div>
			<div class="rounded-xl border border-border/70 bg-card/70 px-2 py-2.5">
				<p class="text-xs font-semibold text-foreground">Agency</p>
				<p class="mt-0.5 text-[10px] text-muted-foreground">Choice-driven feed</p>
			</div>
		</div>
	</div>

	<div class="space-y-3 pb-2" data-no-drag>
		<Button
			onclick={handleNext}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			Plant Your Roots
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>

		<div class="text-center">
			<button
				type="button"
				onclick={() => sessionStore.openUnlockScreen()}
				class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<KeyRound class="h-3.5 w-3.5 text-primary" />
				Already have a key? Unlock / Paste Key
			</button>
		</div>
	</div>
</div>
