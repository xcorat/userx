<script lang="ts">
  import type { QuestionData } from './types';
  import QSimpleCard from './QSimpleCard.svelte';
  import { mapNormalizedToTransform } from './animation-utils';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let question: QuestionData;
  export let className: string = '';
  export let normalizedPosition: number | null = null; // [-1..1]
  export let scrollData: { viewportHeight?: number; cardTop?: number; cardHeight?: number } | null = null;
  export let isAnswered: boolean = false;
  export let onAnswerSelect: ((answerId: string) => Promise<any>) | undefined = undefined;

  const dispatch = createEventDispatcher();
  export let cardNode: HTMLElement | null = null;

  let targetNormalized: number = normalizedPosition ?? 0;
  let lastAppliedNormalized: number | null = null;
  let rafId: number | undefined;
  let rafScheduled = false;
  let prefersReducedMotion = false;
  let mql: MediaQueryList | null = null;
  let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;
  let userInteractionHandler: ((e: Event) => void) | null = null;
  let effectiveNormalized: number = normalizedPosition ?? 0;
  let scrollListener: ((e: Event) => void) | null = null;
  let resizeListener: ((e: Event) => void) | null = null;

  function applyTransformFromNormalized(n: number) {
    const t = mapNormalizedToTransform(n);
    if (!cardNode) return;
    if (prefersReducedMotion) {
      cardNode.style.transform = 'none';
      cardNode.style.opacity = '1';
      cardNode.style.willChange = '';
    } else {
      cardNode.style.transform = t.transform;
      cardNode.style.opacity = String(t.opacity);
      cardNode.style.willChange = 'transform, opacity';
    }
    lastAppliedNormalized = n;
    dispatch('animationPositionChange', { pos: n });
  }

  function scheduleUpdate(n: number) {
    targetNormalized = n;
    if (prefersReducedMotion) {
      applyTransformFromNormalized(n);
      return;
    }
    // SSR-safe: if no window or no RAF, apply immediately
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      applyTransformFromNormalized(n);
      return;
    }
    if (!rafScheduled) {
      rafScheduled = true;
      rafId = window.requestAnimationFrame(() => {
        rafScheduled = false;
        applyTransformFromNormalized(targetNormalized);
        rafId = undefined;
      });
    }
  }

  // compute normalized position from scrollData if provided or from node rect otherwise
  $: {
    // prefer explicit normalizedPosition, fall back to scrollData if provided, then to node rect
    if (typeof normalizedPosition === 'number') {
      effectiveNormalized = normalizedPosition;
    } else if (scrollData && cardNode) {
      effectiveNormalized = computeNormalizedFromScrollData(scrollData);
    } else if (cardNode) {
      effectiveNormalized = computeNormalizedFromNode();
    }

    scheduleUpdate(effectiveNormalized);
  }

  function computeNormalizedFromScrollData({ viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0, cardTop = 0, cardHeight = 0 } = {}) {
    const centerY = cardTop + cardHeight / 2;
    const viewportCenter = viewportHeight / 2;
    const normalized = (centerY - viewportCenter) / (viewportHeight / 2);
    return Math.max(-1, Math.min(1, normalized));
  }

  function computeNormalizedFromNode() {
    if (!cardNode || typeof window === 'undefined') return 0;
    const rect = cardNode.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const pos = computeNormalizedFromScrollData({ viewportHeight, cardTop: rect.top, cardHeight: rect.height });
    return pos;
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      if ('matchMedia' in window) {
        mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotion = mql.matches;
        mqlHandler = (e: MediaQueryListEvent) => {
          prefersReducedMotion = e.matches;
          scheduleUpdate(targetNormalized);
        };
        mql.addEventListener('change', mqlHandler);
      }

      // Recompute normalized on scroll/resize
      scrollListener = () => {
        if (!cardNode) return;
        const pos = computeNormalizedFromNode();
        scheduleUpdate(pos);
      };
      resizeListener = () => {
        if (!cardNode) return;
        const pos = computeNormalizedFromNode();
        scheduleUpdate(pos);
      };
      window.addEventListener('scroll', scrollListener, { passive: true });
      window.addEventListener('resize', resizeListener, { passive: true });

      // Cancel scheduled raf if user interacts
      userInteractionHandler = () => {
        if (rafId && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') { window.cancelAnimationFrame(rafId); rafId = undefined; rafScheduled = false; }
      };
      window.addEventListener('wheel', userInteractionHandler, { passive: true });
      window.addEventListener('touchstart', userInteractionHandler, { passive: true });
      window.addEventListener('pointerdown', userInteractionHandler, { passive: true });
    }
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (mql && mqlHandler) mql.removeEventListener('change', mqlHandler);
    if (typeof window !== 'undefined') {
      if (userInteractionHandler) {
        window.removeEventListener('wheel', userInteractionHandler);
        window.removeEventListener('touchstart', userInteractionHandler);
        window.removeEventListener('pointerdown', userInteractionHandler);
      }
      if (scrollListener) window.removeEventListener('scroll', scrollListener);
      if (resizeListener) window.removeEventListener('resize', resizeListener);
    }
  });
</script>

<div bind:this={cardNode} class={className} role="group">
  <QSimpleCard {question} {isAnswered} {onAnswerSelect} on:answered={(e) => dispatch('answered', e.detail)} on:answerSelect={(e) => dispatch('answerSelect', e.detail)} on:selectionError={(e) => dispatch('selectionError', e.detail)} on:skip={(e) => dispatch('skip', e.detail)} />
</div>
