<script lang="ts">
  import QSimpleCard from './QSimpleCard.svelte';
  import QAutoVAnimCard from './QAutoVAnimCard.svelte';
  import type { QuestionWithStats, CreateAnswerDTO } from '$lib/models';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    question: QuestionWithStats;
    onAnswer: (data: CreateAnswerDTO) => Promise<void>;
    onSkip?: (() => void);
    nextCardRef?: HTMLElement | null;
    normalizedPosition?: number | null;
  }

  let { 
    question, 
    onAnswer, 
    onSkip = undefined, 
    nextCardRef = null, 
    normalizedPosition = null 
  }: Props = $props();

  // Screen size detection - mobile is below md breakpoint (768px)
  let isMobile = $state(false);
  let mql: MediaQueryList | null = null;
  let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;

  onMount(() => {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      // md breakpoint is 768px, so mobile is < 768px
      mql = window.matchMedia('(max-width: 767px)');
      isMobile = mql.matches;
      mqlHandler = (e: MediaQueryListEvent) => {
        isMobile = e.matches;
      };
      mql.addEventListener('change', mqlHandler);
    }
  });

  onDestroy(() => {
    if (mql && mqlHandler) {
      mql.removeEventListener('change', mqlHandler);
    }
  });

  // Map QuestionWithStats -> QuestionData required by card components
  let mapped: any = $state({
    id: question.id,
    title: question.text,
    qcomment: '',
    answers: question.choices.map((c) => ({ id: c.id, text: c.text, stats: undefined })),
    footerLinks: undefined
  });

  $effect(() => {
    mapped = {
      id: question.id,
      title: question.text,
      qcomment: '',
      answers: question.choices.map((c) => ({ id: c.id, text: c.text, stats: undefined })),
      footerLinks: undefined
    };
  });

  async function handleAnswerSelect(answerId: string) {
    if (!authStore.currentUser) throw new Error('Not authenticated');
    const payload: CreateAnswerDTO = {
      userId: authStore.currentUser.id,
      questionId: question.id,
      choiceId: answerId,
      visibility: 'public'
    } as CreateAnswerDTO;

    return await onAnswer(payload);
  }
</script>

{#if isMobile}
  <QAutoVAnimCard 
    question={mapped} 
    isAnswered={question.userAnswered} 
    onAnswerSelect={handleAnswerSelect} 
    nextCardRef={nextCardRef}
    normalizedPosition={normalizedPosition ?? 0}
  />
{:else}
  <QSimpleCard question={mapped} isAnswered={question.userAnswered} onAnswerSelect={handleAnswerSelect} onSkip={onSkip} />
{/if}
