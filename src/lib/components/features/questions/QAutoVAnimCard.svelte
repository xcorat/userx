<script lang="ts">
  import QVAnimCard from './QVAnimCard.svelte';
  import type { QuestionData } from './types';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let question: QuestionData;
  export let className: string = '';
  export let normalizedPosition: number | null = null;
  export let scrollData: any = null;
  export let isAnswered: boolean = false;
  export let onAnswerSelect: ((answerId: string) => Promise<any>) | undefined = undefined;
  export let nextCardRef: HTMLElement | null = null;
  export let autoScrollDelay: number = 300; // ms between success and autoscroll

  const dispatch = createEventDispatcher();
  export let cardNode: HTMLElement | null = null;

  let pendingAutoScroll: ReturnType<typeof setTimeout> | undefined;
  let pendingComplete: ReturnType<typeof setTimeout> | undefined;
  let io: IntersectionObserver | null = null;
  let prefersReducedMotion: boolean = false;
  let mql: MediaQueryList | null = null;
  let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;
  let userInteractionHandler: ((e: Event) => void) | null = null;

  async function handleSelected(e: CustomEvent) {
    const detail = e.detail as { questionId: string; choiceId: string };
    const { choiceId: answerId } = detail;
    const elapsed = 0; // we don't have the elapsed from the child event; this is a placeholder

    // Re-dispatch answered event to allow parent to know
    dispatch('answered', detail);
    // Dispatch telemetry event
    dispatch('answer_selected', { questionId: question.id, answerId, elapsedMs: elapsed, success: true });

    // autoscroll if nextCardRef exists
    if (nextCardRef) {
      dispatch('autoScrollRequested', { questionId: question.id, nextCardRef });
      // schedule start after a small delay to allow animations to finish
      if (typeof setTimeout !== 'undefined') {
        pendingAutoScroll = (setTimeout(() => {
          dispatch('autoScrollStarted', { questionId: question.id });
          try { nextCardRef.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch {}

          // use IntersectionObserver to detect when the target is sufficiently visible
          if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            io = new IntersectionObserver((entries) => {
              const ent = entries[0];
              if (ent && ent.isIntersecting) {
                dispatch('autoScrollComplete', { questionId: question.id });
                try { (nextCardRef as HTMLElement).focus(); } catch {}
                cleanupObserver();
              }
            }, { threshold: 0.6 });
            io.observe(nextCardRef);
          } else {
            // Fallback: assume 600ms
            pendingComplete = (setTimeout(() => {
              dispatch('autoScrollComplete', { questionId: question.id });
              try { (nextCardRef as HTMLElement).focus(); } catch {}
            }, 600) as unknown) as ReturnType<typeof setTimeout>;
          }
        }, autoScrollDelay) as unknown) as ReturnType<typeof setTimeout> ;
      } else {
        // fallback: directly start and complete
        dispatch('autoScrollStarted', { questionId: question.id });
        dispatch('autoScrollComplete', { questionId: question.id });
        try { (nextCardRef as HTMLElement).focus(); } catch {}
      }
    } else {
      dispatch('autoScrollRequested', { questionId: question.id });
    }

    return;
  }

  function handleSelectionError(e: CustomEvent) {
    const { error } = e.detail as { questionId: string; error?: string };
    dispatch('selectionError', { questionId: question.id, error });
  }

  function cleanupObserver() {
    if (io) {
      try { io.disconnect(); } catch {}
      io = null;
    }
    if (pendingComplete) clearTimeout(pendingComplete);
    pendingComplete = undefined;
  }

  onMount(() => {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion = mql.matches;
      mqlHandler = (e) => { prefersReducedMotion = (e as MediaQueryListEvent).matches; };
      mql.addEventListener('change', mqlHandler);
    }

    // If the user interacts with the page before autoScroll completes, cancel it
    userInteractionHandler = () => {
      if (pendingAutoScroll) { clearTimeout(pendingAutoScroll); pendingAutoScroll = undefined; }
      if (pendingComplete) { clearTimeout(pendingComplete); pendingComplete = undefined; }
      cleanupObserver();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('wheel', userInteractionHandler, { passive: true });
      window.addEventListener('touchstart', userInteractionHandler, { passive: true });
      window.addEventListener('pointerdown', userInteractionHandler, { passive: true });
    }
  });

  onDestroy(() => {
    if (pendingAutoScroll) clearTimeout(pendingAutoScroll);
    if (mql && mqlHandler) mql.removeEventListener('change', mqlHandler);
    if (typeof window !== 'undefined' && userInteractionHandler) {
      window.removeEventListener('wheel', userInteractionHandler);
      window.removeEventListener('touchstart', userInteractionHandler);
      window.removeEventListener('pointerdown', userInteractionHandler);
    }
    cleanupObserver();
  });
</script>

<QVAnimCard bind:cardNode={cardNode} {question} {className} {normalizedPosition} {scrollData} {isAnswered} {onAnswerSelect} on:answered={(e) => handleSelected(e)} on:selectionError={(e) => handleSelectionError(e)} on:answerSelect={(e) => dispatch('answerSelect', e.detail)} on:skip={(e) => dispatch('skip', e.detail)} />

