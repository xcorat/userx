<script lang="ts">
  import { createEventDispatcher } from 'svelte';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Check } from 'lucide-svelte';
  
  
import type { QuestionData } from './types';

  // Props
  export let question: QuestionData;
  export let isAnswered: boolean = false;
  export let className: string = '';
  export let onAnswerSelect: ((answerId: string) => Promise<any>) | undefined = undefined;
  export let onSkip: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  let selectedChoiceId: string = '';
  let lastSelected: string = '';
  let pending = false;
  let errorMessage: string | null = null;
  let localAnswered = isAnswered;
  let announcement = '';

  $: if (isAnswered !== localAnswered) localAnswered = isAnswered;

  $: if (selectedChoiceId && selectedChoiceId !== lastSelected && !pending && !localAnswered) {
    lastSelected = selectedChoiceId;
    handleSelect(selectedChoiceId);
  }

  async function handleSelect(choiceId: string) {
    if (localAnswered || pending) return;

    pending = true;
    errorMessage = null;
    announcement = `Selected answer ${choiceId}`;
    dispatch('answerSelect', { questionId: question.id, choiceId });

    if (onAnswerSelect) {
      try {
        const result = await onAnswerSelect(choiceId);
        // If handler indicates success, mark answered
        localAnswered = true;
        // If result returns updated stats, merge them in
        if (result && Array.isArray(result.updatedAnswers)) {
          // Expect result.updatedAnswers: {id, stats}
          result.updatedAnswers.forEach((u: any) => {
            const a = question.answers.find((x) => x.id === u.id);
            if (a) a.stats = u.stats;
          });
        }
        announcement = 'Answer submitted';
        dispatch('answered', { questionId: question.id, choiceId });
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
        // Reset selection to allow retry
        selectedChoiceId = '';
        lastSelected = '';
        dispatch('selectionError', { questionId: question.id, error: errorMessage });
      } finally {
        pending = false;
      }
    } else {
      // no-op: just mark answered
      localAnswered = true;
      pending = false;
    }
  }

  function handleSkipClick() {
    dispatch('skip', { questionId: question.id });
    onSkip && onSkip();
  }
</script>

<Card class={className} aria-live="polite" role="group" aria-labelledby={question.id + '-legend'} tabindex={0}>
  <CardHeader>
    <CardTitle>{question.title}</CardTitle>
    {#if question.qcomment}
      <CardDescription>{question.qcomment}</CardDescription>
    {/if}
  </CardHeader>

  <CardContent>
    <div class="space-y-3">
      <fieldset>
        <legend id={question.id + '-legend'} class="sr-only">{question.title}</legend>
        {#if question.answers && question.answers.length > 0}
          <RadioGroup bind:value={selectedChoiceId} class="space-y-3" role="radiogroup" aria-labelledby={question.id + '-legend'}>
          {#each question.answers as ans}
            <label for={ans.id} class={selectedChoiceId === ans.id ? 'flex items-center justify-between p-3 rounded-md border border-primary bg-primary/5 transition-colors cursor-pointer' : 'flex items-center justify-between p-3 rounded-md border border-transparent hover:bg-secondary/40 transition-colors cursor-pointer'}>
              <div class="flex items-center space-x-3">
                <RadioGroupItem id={ans.id} value={ans.id} disabled={pending || localAnswered} />
                <span class="select-none">{ans.text}</span>
              </div>

              <div class="flex items-center space-x-3">
                {#if localAnswered && typeof ans.stats === 'number'}
                  <span class="text-sm text-muted-foreground">{ans.stats}%</span>
                {/if}

                {#if (selectedChoiceId === ans.id) }
                  <Check class="size-4 text-primary" />
                {/if}
              </div>
            </label>
          {/each}
          </RadioGroup>
        {:else}
          <p class="text-sm text-muted-foreground">No answers available</p>
        {/if}
      </fieldset>

      {#if errorMessage}
        <p class="text-sm text-destructive">{errorMessage}</p>
      {/if}

      <div class="sr-only" aria-live="polite">{announcement}</div>
    </div>
  </CardContent>

  <CardFooter>
    <div class="w-full flex items-center justify-between">
      <div>
        {#if localAnswered}
          <Badge variant="secondary">Answered</Badge>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if onSkip}
          <Button variant="outline" size="sm" onclick={handleSkipClick} disabled={pending || localAnswered}>Skip</Button>
        {/if}
        {#if pending}
          <span class="text-sm text-muted-foreground">Submitting...</span>
        {/if}
      </div>
    </div>
  </CardFooter>
</Card>

<style>
  :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.transition-colors) { transition: none !important; }
  }
</style>
