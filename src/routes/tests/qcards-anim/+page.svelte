<script lang="ts">
  import QVAnimCard from '$lib/components/features/questions/QVAnimCard.svelte';
  import QAutoVAnimCard from '$lib/components/features/questions/QAutoVAnimCard.svelte';
  import { mapNormalizedToTransform } from '$lib/components/features/questions/animation-utils';
  import { onMount } from 'svelte';

  let questions = [
    {
      id: 'q_1',
      title: 'Which color do you like?',
      qcomment: 'Pick one',
      answers: [ { id: 'a1', text: 'Red', stats: 40 }, { id: 'a2', text: 'Blue', stats: 60 } ]
    },
    {
      id: 'q_2',
      title: 'Which animal?',
      answers: [ { id: 'a3', text: 'Dog', stats: 72 }, { id: 'a4', text: 'Cat', stats: 28 } ]
    }
  ];

  let cardNodes: HTMLElement[] = [];
  let normalized = [0, 1];

  function computeNormalized(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const centerY = rect.top + rect.height / 2;
    return Math.max(-1, Math.min(1, (centerY - viewportHeight / 2) / (viewportHeight / 2)));
  }

  function onScroll() {
    cardNodes.forEach((el, i) => {
      if (!el) return;
      normalized[i] = computeNormalized(el);
    });
  }

  onMount(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  });

  async function fakeOnAnswer(answerId: string) {
    await new Promise(r => setTimeout(r, 300));
    return { success: true };
  }
</script>

<div class="space-y-4 p-6">
  <h2 class="text-lg font-medium">QCards Anim Demo</h2>

  {#each questions as q, i}
    <div bind:this={cardNodes[i]} tabindex={0} class="max-w-md mx-auto">
      {#if i === 0}
        <QAutoVAnimCard question={q} normalizedPosition={normalized[i]} onAnswerSelect={fakeOnAnswer} nextCardRef={cardNodes[i+1]} />
      {:else}
        <QVAnimCard question={q} normalizedPosition={normalized[i]} onAnswerSelect={fakeOnAnswer} />
      {/if}
    </div>
  {/each}
</div>
