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

  let pendingAutoScroll: number | undefined;
  let pendingComplete: number | undefined;
  let io: IntersectionObserver | null = null;

  async function handleSelected(e: CustomEvent) {
    const { choiceId: answerId } = e.detail as { questionId: string; choiceId: string };
    const elapsed = 0; // we don't have the elapsed from the child event; this is a placeholder
    dispatch('answered', { questionId: question.id, answerId, elapsedMs: elapsed, success: true });

    // autoscroll if nextCardRef exists
    if (nextCardRef) {
      dispatch('autoScrollRequested', { questionId: question.id, nextCardRef });
      // schedule start after a small delay to allow animations to finish
      if (typeof setTimeout !== 'undefined') {
        pendingAutoScroll = setTimeout(() => {
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
            pendingComplete = setTimeout(() => {
              dispatch('autoScrollComplete', { questionId: question.id });
              try { (nextCardRef as HTMLElement).focus(); } catch {}
            }, 600);
          }
        }, autoScrollDelay);
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
    const { choiceId: answerId } = e.detail as { questionId: string; choiceId: string };
    const elapsed = 0; // placeholder
    dispatch('answered', { questionId: question.id, answerId, elapsedMs: elapsed, success: false });
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
    // placeholder: future perf listeners if needed
  });

  onDestroy(() => {
    if (pendingAutoScroll) clearTimeout(pendingAutoScroll);
    cleanupObserver();
  });
</script>

<QVAnimCard bind:cardNode={cardNode} {question} {className} {normalizedPosition} {scrollData} {isAnswered} {onAnswerSelect} on:answered={(e) => handleSelected(e)} on:selectionError={(e) => handleSelectionError(e)} on:answerSelect={(e) => dispatch('answerSelect', e.detail)} on:skip={(e) => dispatch('skip', e.detail)} />

