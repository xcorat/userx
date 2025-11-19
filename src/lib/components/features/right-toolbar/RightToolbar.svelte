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
  };

  export let items: ToolbarItem[] = [];
  export let variant: 'auto' | 'fab' | 'toolbar' = 'auto';

  let isFab = false;
  let mql: MediaQueryList | null = null;

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
        on:click={() => handleClick(item)}
        aria-label={item.ariaLabel}
        title={item.title}
      >
        {#if item.icon}
          <svelte:component this={item.icon} size={18} />
        {/if}
      </button>
    {/each}
  {:else}
    <!-- Vertical toolbar variant: rectangular / square buttons with subtle background -->
    {#each items as item}
      <button
        class="rt-btn toolbar-variant {item.className}"
        on:click={() => handleClick(item)}
        aria-label={item.ariaLabel}
        title={item.title}
      >
        {#if item.icon}
          <svelte:component this={item.icon} size={16} />
        {/if}
      </button>
    {/each}
  {/if}

  <slot />
</div>

<style>
  /* Container sits at right edge below header */
  .right-toolbar {
    position: fixed;
    right: 1rem;
    top: var(--memeball-header-offset, 56px);
    z-index: 100; /* ensure top-most over meme */
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #06d6a0);
    z-index: 110;
  }

  /* Toolbar style */
  .toolbar-variant {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    z-index: 110;
  }

  .rt-btn:hover { transform: translateY(-2px); }
  .rt-btn:active { transform: translateY(0); }

  /* Show toolbar on medium/desktop screens (≥640px) by default; otherwise auto toggles it */
  @media (max-width: 639px) {
    .right-toolbar { align-items: flex-end; }
  }
</style>
