<script lang="ts">
  import { Mail, Phone, MessageCircle, Facebook, Globe } from 'lucide-svelte';

  interface Props {
    value: string;
    onSelect: (value: string) => void;
  }

  let { value = $bindable('email'), onSelect }: Props = $props();

  const methods = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'other', label: 'Other', icon: Globe }
  ];

  const handleSelect = (methodValue: string) => {
    value = methodValue;
    onSelect?.(methodValue);
  };
</script>

<div class="contact-method-selector" role="radiogroup" aria-label="Select contact method">
  {#each methods as method}
    <button
      type="button"
      role="radio"
      aria-checked={value === method.value}
      class="method-option"
      class:selected={value === method.value}
      onclick={() => handleSelect(method.value)}
    >
      <svelte:component this={method.icon} size={24} strokeWidth={2} />
      <span class="method-label">{method.label}</span>
    </button>
  {/each}
</div>

<style>
  .contact-method-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: var(--se-space-sm, 0.5rem);
    width: 100%;
  }

  .method-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--se-space-xs, 0.375rem);
    padding: var(--se-space-lg, 1rem) var(--se-space-md, 0.75rem);
    background: var(--se-surface, #ebe6dd);
    border: 2px solid transparent;
    border-radius: var(--se-radius-md, 8px);
    cursor: pointer;
    transition: all var(--se-duration-fast, 150ms) var(--se-ease, ease);
    color: var(--se-muted-foreground, #6b6055);
    font-size: var(--se-text-sm, 0.875rem);
    font-weight: var(--se-font-medium, 500);
    font-family: inherit;
  }

  .method-option:hover {
    background: var(--se-surface-hover, #e0d9cc);
    color: var(--se-foreground, #2a251f);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  .method-option:focus-visible {
    outline: 2px solid var(--se-accent, #4b7a56);
    outline-offset: 2px;
  }

  .method-option.selected {
    background: var(--se-accent, #4b7a56);
    color: var(--se-accent-foreground, #ffffff);
    border-color: var(--se-accent-hover, #3d5f44);
    transform: translateY(0);
  }

  .method-option.selected:hover {
    background: var(--se-accent-hover, #3d5f44);
    transform: translateY(0);
  }

  .method-label {
    font-size: var(--se-text-sm, 0.875rem);
    font-weight: var(--se-font-medium, 500);
  }

  @media (max-width: 640px) {
    .contact-method-selector {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .contact-method-selector {
      grid-template-columns: 1fr;
    }

    .method-option {
      flex-direction: row;
      justify-content: flex-start;
      gap: var(--se-space-md, 0.75rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .method-option {
      transition: none;
    }

    .method-option:hover {
      transform: none;
    }
  }
</style>
