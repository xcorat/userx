<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		title: string;
		summary: string;
		tldr?: string;
		links?: Array<{ label: string; href: string }>;
	}

	let { title, summary, tldr, links = [], children }: Props = $props();

	let expanded = $state(false);
	let prefersReducedMotion = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			prefersReducedMotion = mediaQuery.matches;
			
			const handler = (e: MediaQueryListEvent) => {
				prefersReducedMotion = e.matches;
			};
			
			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
	});

	function toggle() {
		expanded = !expanded;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<div class="expandable-card">
	<button
		class="card-header"
		onclick={toggle}
		onkeydown={handleKeydown}
		aria-expanded={expanded}
		type="button"
	>
		<div class="card-header-content">
			<h3 class="card-title">{title}</h3>
			<p class="card-summary">{summary}</p>
		</div>
		<div class="expand-icon" class:expanded>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M5 7.5L10 12.5L15 7.5"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	</button>

	{#if expanded}
		<div class="card-body" transition:slide={{ duration: prefersReducedMotion ? 0 : 300 }}>
			{#if tldr}
				<div class="card-tldr">
					<span class="tldr-label">TL;DR:</span>
					<span class="tldr-text">{tldr}</span>
				</div>
			{/if}
			
			<div class="card-content">
				{@render children?.()}
			</div>

			{#if links && links.length > 0}
				<div class="card-links">
					<span class="links-label">Learn more:</span>
					{#each links as link}
						<a href={link.href} class="card-link" target="_blank" rel="noopener noreferrer">
							{link.label}
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M10.5 7.5V11.5H2.5V3.5H6.5M8.5 2.5H12.5M12.5 2.5V6.5M12.5 2.5L6 9"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.expandable-card {
		background: var(--se-card-background, #ffffff);
		border: 1px solid var(--se-card-border, rgba(122, 90, 52, 0.12));
		border-radius: var(--se-radius-lg, 12px);
		box-shadow: var(--se-shadow-md, 0 4px 8px rgba(42, 37, 31, 0.1));
		transition: all var(--se-duration-normal, 200ms) var(--se-ease-in-out, ease);
		overflow: hidden;
	}

	.expandable-card:hover {
		box-shadow: var(--se-shadow-lg, 0 8px 16px rgba(42, 37, 31, 0.12));
		border-color: var(--se-border-emphasis, rgba(122, 90, 52, 0.25));
	}

	.card-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--se-space-lg, 1rem);
		padding: var(--se-space-xl, 1.5rem);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background var(--se-duration-normal, 200ms) var(--se-ease, ease);
	}

	.card-header:hover {
		background: var(--se-surface, #ebe6dd);
	}

	.card-header:focus-visible {
		outline: 2px solid var(--se-ring, #4b7a56);
		outline-offset: -2px;
	}

	.card-header-content {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-size: var(--se-text-xl, 1.5rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-sm, 0.5rem) 0;
		line-height: var(--se-leading-tight, 1.25);
	}

	.card-summary {
		font-size: var(--se-text-base, 1rem);
		color: var(--se-muted-foreground, #6b6055);
		margin: 0;
		line-height: var(--se-leading-normal, 1.5);
	}

	.expand-icon {
		flex-shrink: 0;
		color: var(--se-accent, #4b7a56);
		transition: transform var(--se-duration-normal, 200ms) var(--se-ease-in-out, ease);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	.card-body {
		padding: 0 var(--se-space-xl, 1.5rem) var(--se-space-xl, 1.5rem);
		border-top: 1px solid var(--se-border-subtle, rgba(122, 90, 52, 0.08));
	}

	.card-tldr {
		margin-top: var(--se-space-lg, 1rem);
		padding: var(--se-space-md, 0.75rem) var(--se-space-lg, 1rem);
		background: var(--se-highlight-light, rgba(232, 169, 110, 0.15));
		border-left: 3px solid var(--se-highlight, #e8a96e);
		border-radius: var(--se-radius-sm, 4px);
		font-size: var(--se-text-sm, 0.875rem);
		line-height: var(--se-leading-normal, 1.5);
	}

	.tldr-label {
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-primary, #7a5a34);
		margin-right: var(--se-space-xs, 0.25rem);
	}

	.tldr-text {
		color: var(--se-foreground, #2a251f);
	}

	.card-content {
		padding-top: var(--se-space-lg, 1rem);
		color: var(--se-foreground, #2a251f);
		font-size: var(--se-text-base, 1rem);
		line-height: var(--se-leading-relaxed, 1.625);
	}

	.card-content :global(p) {
		margin: 0 0 var(--se-space-md, 0.75rem) 0;
	}

	.card-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.card-content :global(strong) {
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-primary, #7a5a34);
	}

	.card-content :global(.example) {
		font-style: italic;
		color: var(--se-muted-foreground, #6b6055);
		font-size: var(--se-text-sm, 0.875rem);
		margin: var(--se-space-md, 0.75rem) 0;
		padding-left: var(--se-space-lg, 1rem);
		border-left: 2px solid var(--se-accent, #4b7a56);
	}

	.card-content :global(ul) {
		margin: var(--se-space-md, 0.75rem) 0;
		padding-left: var(--se-space-xl, 1.5rem);
	}

	.card-content :global(li) {
		margin-bottom: var(--se-space-sm, 0.5rem);
	}

	.card-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--se-space-md, 0.75rem);
		margin-top: var(--se-space-xl, 1.5rem);
		padding-top: var(--se-space-lg, 1rem);
		border-top: 1px solid var(--se-border-subtle, rgba(122, 90, 52, 0.08));
	}

	.links-label {
		font-size: var(--se-text-sm, 0.875rem);
		font-weight: var(--se-font-medium, 500);
		color: var(--se-muted-foreground, #6b6055);
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		gap: var(--se-space-xs, 0.25rem);
		padding: var(--se-space-sm, 0.5rem) var(--se-space-md, 0.75rem);
		background: var(--se-surface, #ebe6dd);
		color: var(--se-primary, #7a5a34);
		text-decoration: none;
		font-size: var(--se-text-sm, 0.875rem);
		font-weight: var(--se-font-medium, 500);
		border-radius: var(--se-radius-sm, 4px);
		transition: all var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.card-link:hover {
		background: var(--se-primary, #7a5a34);
		color: var(--se-primary-foreground, #ffffff);
		transform: translateY(-1px);
	}

	.card-link:focus-visible {
		outline: 2px solid var(--se-ring, #4b7a56);
		outline-offset: 2px;
	}

	.card-link svg {
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.expandable-card,
		.card-header,
		.expand-icon,
		.card-link {
			transition: none;
		}
	}
</style>
