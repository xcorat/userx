<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Check } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	function selectTheme(id: (typeof themeStore.availableThemes)[number]['id']) {
		if (themeStore.themeId === id) return;
		themeStore.setTheme(id);
		toast.success('Theme updated locally (not saved to ledger)');
	}
</script>

<div
	class={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}
	role="group"
	aria-label="Available appearance themes"
>
	{#each themeStore.availableThemes as theme (theme.id)}
		{@const active = themeStore.themeId === theme.id}
		<button
			type="button"
			aria-pressed={active}
			aria-label={`${theme.name}: ${theme.fonts.preview}${active ? ', selected' : ''}`}
			onclick={() => selectTheme(theme.id)}
			class={`flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
				active
					? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
					: 'border-border/80 bg-background/60 text-foreground hover:border-primary/50 hover:bg-card'
			}`}
		>
			<span class="mt-0.5 flex shrink-0 flex-col gap-1" aria-hidden="true">
				<span
					class="h-3 w-3 rounded-full border border-foreground/15"
					style={`background-color: ${theme.swatches.bg};`}
				></span>
				<span
					class="h-3 w-3 rounded-full"
					style={`background-color: ${theme.swatches.primary};`}
				></span>
				<span
					class="h-3 w-3 rounded-full"
					style={`background-color: ${theme.swatches.accent};`}
				></span>
			</span>

			<span class="min-w-0 flex-1">
				<span class="flex items-center justify-between gap-2">
					<span class="truncate text-sm font-semibold">{theme.name}</span>
					{#if active}
						<Check class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
					{/if}
				</span>
				<span
					class="mt-1 block truncate text-xs font-medium text-primary"
					style={`font-family: ${theme.fonts.display};`}
				>
					Aa — {theme.fonts.preview}
				</span>
				<span class="mt-1 block text-xs leading-snug text-muted-foreground">
					{theme.description}
				</span>
			</span>
		</button>
	{/each}
</div>
