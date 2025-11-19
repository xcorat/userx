<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { SvelteComponent } from 'svelte';
  import { Plus, RefreshCw, Heart, X } from 'lucide-svelte';

  type ToolbarItem = {
    id: string;
    icon?: typeof SvelteComponent | any;
    handler?: () => void;
    ariaLabel?: string;
    title?: string;
    className?: string;
    color?: string;
  };

  export let items: ToolbarItem[] = [];
  export let variant: 'auto' | 'fab' | 'toolbar' = 'auto';

  let isFab = false;
  let mql: MediaQueryList | null = null;
  const defaultColorMap = {
    new: 'primary',
    refresh: 'neutral',
    pick: 'primary',
    reject: 'danger'
  } as Record<string, string>;

  function evaluateVariant() {
    if (variant === 'fab') return (isFab = true);
    if (variant === 'toolbar') return (isFab = false);

    // auto mode - choose FAB on small screens
    if (!mql) {
      mql = window.matchMedia('(max-width: 639px)');
    }
    isFab = mql.matches;
  }

  function onMqlChange() {
    evaluateVariant();
  }

  onMount(() => {
    // If user did not supply items, provide a default 'new meme' action
    if (items.length === 0) {
      items = [
        { id: 'new', icon: Plus, ariaLabel: 'Submit new meme', title: 'Submit new meme' }
      ];
    }

    if (variant === 'auto') {
      mql = window.matchMedia('(max-width: 639px)');
      mql.addEventListener('change', onMqlChange);
    }

    evaluateVariant();
  });

  onDestroy(() => {
    if (mql) {
      try { mql.removeEventListener('change', onMqlChange); } catch (e) { /* ignore */ }
      mql = null;
    }
  });

  // convenience click proxy so parent can pass handlers
  function handleClick(item: ToolbarItem) {
    if (item?.handler) item.handler();
  }
</script>

<div
  class="right-toolbar"
  role="toolbar"
  aria-orientation="vertical"
  aria-label="Right toolbar"
>
  {#if isFab}
    <!-- Stacked FAB style: circular buttons aligned vertically -->
    {#each items as item}
      <button
        class="rt-btn fab-variant {item.className}"
        data-color={item.color || defaultColorMap[item.id] || 'neutral'}
        on:click={() => handleClick(item)}
        aria-label={item.ariaLabel}
        title={item.title}
      >
        {#if item.icon}
          <svelte:component this={item.icon} size={28} />
        {/if}
      </button>
    {/each}
  {:else}
    <!-- Vertical toolbar variant: rectangular / square buttons with subtle background -->
    {#each items as item}
      <button
        class="rt-btn toolbar-variant {item.className}"
        data-color={item.color || defaultColorMap[item.id] || 'neutral'}
        on:click={() => handleClick(item)}
        aria-label={item.ariaLabel}
        title={item.title}
      >
        {#if item.icon}
          <svelte:component this={item.icon} size={28} />
        {/if}
      </button>
    {/each}
  {/if}

  <slot />
</div>

<style>
  /* Container sits at right edge below header */
  .right-toolbar {
    /* Float inside the parent container (e.g. .meme-viewer) */
    position: absolute;
    right: var(--memeball-right-offset, 2rem);
    bottom: var(--memeball-bottom-offset, 5.5rem);
    z-index: 100; /* ensure top-most over meme */
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    pointer-events: none; /* invisible background - only child elements are clickable */
    align-items: flex-end;
  }

  /* Individual buttons are clickable - pointer events enabled */
  .rt-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 150ms ease, box-shadow 150ms ease;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    color: white;
    border: none;
    outline: none;
    backdrop-filter: blur(6px);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .rt-btn:focus {
    box-shadow: 0 0 0 3px rgba(255,255,255,0.08);
    transform: translateY(-2px);
  }

  /* FAB style */
  .fab-variant {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    /* semi-transparent gradient background (alpha 0.2) to match visual spec */
    background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,214,160,0.2));
    z-index: 110;
  }

  /* Toolbar style */
  .toolbar-variant {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    /* Semi-transparent background with 0.2 opacity as requested */
    background: rgba(255, 255, 255, 0.2);
    z-index: 110;
  }

  .rt-btn:hover { transform: translateY(-2px); }
  .rt-btn:active { transform: translateY(0); }

  /* Show toolbar on medium/desktop screens (≥640px) by default; otherwise auto toggles it */
  @media (max-width: 639px) {
    .right-toolbar { align-items: flex-end; }
    /* For small screens keep a slightly smaller variant to avoid obstructing content */
    .fab-variant, .toolbar-variant { width: 56px; height: 56px; }
  }

  /* Color variants */
  .rt-btn[data-color="primary"] { background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,214,160,0.18)); box-shadow: 0 6px 16px rgba(16,185,129,0.24); }
  .rt-btn[data-color="danger"] { background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.18)); box-shadow: 0 6px 16px rgba(239,68,68,0.24); }
  .rt-btn[data-color="neutral"] { background: rgba(255,255,255,0.06); box-shadow: 0 6px 16px rgba(0,0,0,0.42); }
  .rt-btn[data-color="accent"] { background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(124,58,237,0.18)); box-shadow: 0 6px 16px rgba(139,92,246,0.24); }
  .rt-btn[data-color="primary"], .rt-btn[data-color="accent"], .rt-btn[data-color="danger"] { color: white; }

  /* Hover color-specific shadows */
  .rt-btn:hover[data-color="primary"] { box-shadow: 0 10px 28px rgba(16,185,129,0.28); }
  .rt-btn:hover[data-color="danger"] { box-shadow: 0 10px 28px rgba(239,68,68,0.28); }
  .rt-btn:hover[data-color="accent"] { box-shadow: 0 10px 28px rgba(139,92,246,0.28); }
</style>
