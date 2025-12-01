<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils.js';

  interface Props {
    label: string;
    value: string;
    variant?: 'sage' | 'slate' | 'info' | 'highlight';
    href?: string;
  }

  let { label, value, variant = 'sage', href = undefined }: Props = $props();

  // Map our semantic variants to CSS overrides that work with Badge
  const variantClass = (v: Props['variant']) => {
    switch (v) {
      case 'sage':
        return 'bg-[var(--se-badge-sage)] text-[var(--se-badge-sage-foreground)] border-transparent';
      case 'slate':
        return 'bg-[var(--se-badge-slate)] text-[var(--se-badge-slate-foreground)] border-transparent';
      case 'info':
        return 'bg-[var(--se-badge-info)] text-[var(--se-badge-info-foreground)] border-transparent';
      case 'highlight':
        return 'bg-[var(--se-highlight)] text-[var(--se-highlight-foreground)] border-transparent';
      default:
        return '';
    }
  };
</script>

<Badge href={href} class={cn(variantClass(variant))} aria-label={`${label}: ${value}`}>
  <span class="stat-label" aria-hidden="true">{label}</span>
  <span class="stat-value">{value}</span>
</Badge>

<style>
  .stat-label {
    opacity: 0.75;
    margin-right: 0.375rem; /* 6px */
    font-weight: 500;
    font-size: 0.75rem;
  }

  .stat-value {
    font-weight: 700;
    font-size: 0.875rem;
  }
</style>
