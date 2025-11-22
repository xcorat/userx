import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import QSimpleCard from './QSimpleCard.svelte';

const question = {
  id: 'q1',
  title: 'Best programming language?',
  qcomment: 'Pick one',
  answers: [
    { id: 'a1', text: 'JavaScript', stats: 32 },
    { id: 'a2', text: 'TypeScript', stats: 68 }
  ]
};

describe('QSimpleCard', () => {
  it('renders question and answers', () => {
    const { getByText } = render(QSimpleCard, { question });
    expect(getByText('Best programming language?')).toBeTruthy();
    expect(getByText('JavaScript')).toBeTruthy();
    expect(getByText('TypeScript')).toBeTruthy();
  });

  it('calls onAnswerSelect when answer is clicked', async () => {
    const onAnswerSelect = vi.fn(() => Promise.resolve({ success: true }));
    const { getByLabelText } = render(QSimpleCard, { question, onAnswerSelect });
    const js = getByLabelText('JavaScript');
    await fireEvent.click(js);
    expect(onAnswerSelect).toHaveBeenCalled();
  });

  it('disables choices when isAnswered is true', async () => {
    const { getByLabelText } = render(QSimpleCard, { question, isAnswered: true });
    const js = getByLabelText('JavaScript') as HTMLInputElement;
    expect(js.disabled).toBeTruthy();
  });

  it('shows pending state while submitting', async () => {
    let resolveFunc: (v?: any) => void = () => {};
    const onAnswerSelect = vi.fn(() => new Promise((r) => { resolveFunc = r; }));
    const { getByLabelText, getByText } = render(QSimpleCard, { question, onAnswerSelect });
    const js = getByLabelText('JavaScript');
    await fireEvent.click(js);
    // Pending should show
    expect(getByText('Submitting...')).toBeTruthy();
    // Resolve promise
    resolveFunc && resolveFunc({ success: true });
  });

  it('merges updatedAnswers on success', async () => {
    const updatedAnswers = [{ id: 'a1', stats: 35 }, { id: 'a2', stats: 65 }];
    const onAnswerSelect = vi.fn(() => Promise.resolve({ updatedAnswers }));
    const { getByLabelText, findByText } = render(QSimpleCard, { question, onAnswerSelect });
    const js = getByLabelText('JavaScript');
    await fireEvent.click(js);
    // Expect updated stat to be displayed
    expect(await findByText('35%')).toBeTruthy();
  });

  it('displays error when selection fails', async () => {
    const onAnswerSelect = vi.fn(() => Promise.reject(new Error('Failed to submit')));
    const { getByLabelText, findByText } = render(QSimpleCard, { question, onAnswerSelect });
    const js = getByLabelText('JavaScript');
    await fireEvent.click(js);
    expect(await findByText('Failed to submit')).toBeTruthy();
  });
});
