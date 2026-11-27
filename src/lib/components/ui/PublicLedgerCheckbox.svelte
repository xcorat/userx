<script lang="ts">
	import { Globe, Lock } from 'lucide-svelte';

	interface Props {
		checked?: boolean;
		label?: string;
		id?: string;
		compact?: boolean;
		onchange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		label = 'keep public',
		id,
		compact = false,
		onchange
	}: Props = $props();

	function handleToggle() {
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	type="button"
	{id}
	role="checkbox"
	aria-checked={checked}
	onclick={handleToggle}
	class={`group inline-flex items-center gap-2 rounded-full border transition-all select-none cursor-pointer ${
		compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs font-medium'
	} ${
		checked
			? 'border-primary/50 bg-primary/15 text-foreground'
			: 'border-border bg-secondary/60 text-muted-foreground hover:border-border/80 hover:text-foreground'
	}`}
>
	<span
		class={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors ${
			checked
				? 'border-primary bg-primary text-primary-foreground'
				: 'border-muted-foreground/50 bg-background/60'
		}`}
	>
		{#if checked}
			<svg viewBox="0 0 12 12" class="h-3 w-3 stroke-current" fill="none" stroke-width="2">
				<path d="M2.5 6.2 5 8.7 9.5 3.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		{/if}
	</span>

	<span>{label}</span>

	<span
		class={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
			checked
				? 'bg-primary/20 text-primary'
				: 'bg-background/70 text-muted-foreground'
		}`}
	>
		{#if checked}
			<Globe class="h-2.5 w-2.5" />
			Public
		{:else}
			<Lock class="h-2.5 w-2.5" />
			Private
		{/if}
	</span>
</button>
