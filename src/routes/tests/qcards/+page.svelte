<script lang="ts">
  import QSimpleCard from '$lib/components/features/questions/QSimpleCard.svelte';
  import type { CreateAnswerDTO } from '$lib/models';

  let question = {
    id: 'q_demo_1',
    title: 'Which framework do you prefer?',
    qcomment: 'Pick one option to cast your vote',
    answers: [
      { id: 'a_vue', text: 'Vue', stats: 20 },
      { id: 'a_react', text: 'React', stats: 50 },
      { id: 'a_svelte', text: 'Svelte', stats: 30 }
    ]
  };

  let message = '';

  async function onAnswerSelect(answerId: string) {
    message = 'Submitting...';
    // Fake API latency
    await new Promise((r) => setTimeout(r, 500));

    // Fake response: update stats by +1 on selected
    const updatedAnswers = question.answers.map((a) => ({ id: a.id, stats: a.stats }));
    const found = updatedAnswers.find((u) => u.id === answerId);
    if (found) found.stats = Math.min(100, (found.stats || 0) + 1);

    // Simulate success result
    message = 'Submitted!';
    return { success: true, updatedAnswers };
  }

  function onSkip() {
    message = 'Skipped';
    setTimeout(() => (message = ''), 1000);
  }
</script>

<div class="p-6">
  <h2 class="text-lg font-medium mb-3">QSimpleCard Demo</h2>
  <QSimpleCard {question} onAnswerSelect={onAnswerSelect} onSkip={onSkip} />
  {#if message}
    <p class="mt-3 text-sm text-muted-foreground">{message}</p>
  {/if}
</div>
