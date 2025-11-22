<script lang="ts">
  import QSimpleCard from './QSimpleCard.svelte';
  import type { QuestionWithStats, CreateAnswerDTO } from '$lib/models';
  import { authStore } from '$lib/stores/auth.store.svelte';

  export let question: QuestionWithStats;
  export let onAnswer: (data: CreateAnswerDTO) => Promise<void>;
  export let onSkip: (() => void) | undefined = undefined;

  // Map QuestionWithStats -> QuestionData required by QSimpleCard
  let mapped: any = {
    id: question.id,
    title: question.text,
    qcomment: '',
    answers: question.choices.map((c) => ({ id: c.id, text: c.text, stats: undefined })),
    footerLinks: undefined
  };

  $: mapped = {
    id: question.id,
    title: question.text,
    qcomment: '',
    answers: question.choices.map((c) => ({ id: c.id, text: c.text, stats: undefined })),
    footerLinks: undefined
  };

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

<QSimpleCard question={mapped} isAnswered={question.userAnswered} onAnswerSelect={handleAnswerSelect} onSkip={onSkip} />
