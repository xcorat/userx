<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { ThemeId } from '$lib/types';
	import { ArrowLeft, ArrowRight, Check, HardDrive, Sparkles } from 'lucide-svelte';

	let isFinishing = $state(false);

	function selectTheme(id: ThemeId) {
		themeStore.setTheme(id);
	}

	async function handleFinishSetup() {
		if (isFinishing) return;
		isFinishing = true;
		try {
			await sessionStore.completeOnboarding();
		} finally {
			isFinishing = false;
		}
	}
</script>

<div class="flex h-full flex-col justify-between overflow-y-auto px-6 py-6">
	<!-- Top Step Bar -->
	<div class="flex items-center justify-between pt-1">
		<button
			type="button"
			onclick={() => sessionStore.setOnboardingStep('identity')}
			class="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back
		</button>
		<span class="font-mono text-[11px] text-muted-foreground">04 / 04</span>
	</div>

	<div class="my-auto space-y-5 py-4">
		<div class="space-y-2">
			<p class="font-mono text-xs uppercase tracking-widest text-primary">
				Device Personalization
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Let's get the look-and-feel correct
			</h1>
		</div>

		<!-- Local-only storage banner -->
		<div class="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/60 px-3.5 py-2.5 text-xs font-medium text-foreground">
			<HardDrive class="h-4 w-4 shrink-0 text-primary" />
			<span>This selection is ONLY saved locally — never published to the ledger.</span>
		</div>

		<!-- Interactive Theme List -->
		<div class="space-y-2.5">
			{#each themeStore.availableThemes as theme (theme.id)}
				{@const isSelected = themeStore.themeId === theme.id}
				<button
					type="button"
					onclick={() => selectTheme(theme.id)}
					class={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all ${
						isSelected
							? 'border-primary bg-primary/10 ring-1 ring-primary'
							: 'border-border bg-card/75 hover:border-border/90 hover:bg-card'
					}`}
				>
					<div class="min-w-0 space-y-1">
						<div class="flex items-center gap-2">
							<span
								class="text-sm font-semibold text-foreground"
								style={`font-family: ${theme.headingFont};`}
							>
								{theme.name}
							</span>
							<Badge variant="outline" class="text-[10px] capitalize">
								{theme.decoration}
							</Badge>
						</div>
						<p class="line-clamp-2 text-xs text-muted-foreground">
							{theme.description}
						</p>
					</div>

					<!-- Live Color Swatch Preview + Active Check -->
					<div class="flex shrink-0 items-center gap-2.5">
						<div
							class="flex items-center gap-1 rounded-full border border-white/15 p-1"
							style={`background-color: ${theme.swatches.bg};`}
						>
							<span
								class="h-3.5 w-3.5 rounded-full"
								style={`background-color: ${theme.swatches.card};`}
							></span>
							<span
								class="h-3.5 w-3.5 rounded-full"
								style={`background-color: ${theme.swatches.primary};`}
							></span>
							<span
								class="h-3.5 w-3.5 rounded-full"
								style={`background-color: ${theme.swatches.accent};`}
							></span>
						</div>

						<span
							class={`flex h-5 w-5 items-center justify-center rounded-full border ${
								isSelected
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-background/50 text-transparent'
							}`}
						>
							<Check class="h-3 w-3" />
						</span>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Enter App Feed -->
	<div class="pt-2 pb-4">
		<Button
			onclick={handleFinishSetup}
			disabled={isFinishing}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			<Sparkles class="mr-2 h-4 w-4" />
			{isFinishing ? 'Opening Question Feed...' : 'Enter Question Feed'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</div>
