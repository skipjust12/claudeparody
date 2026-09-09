'use client';

import { ArrowRight, ChevronDown, MoreHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const promptOptions = ['hi', 'Say hi.', 'Reply with hi.'];

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [sentPrompt, setSentPrompt] = useState('hi');

  useEffect(() => {
    const modelContext = (
      document as Document & { modelContext?: ModelContext }
    ).modelContext;
    if (!modelContext?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'send_greeting',
          title: 'Send greeting',
          description: 'Send one of the available greeting prompts and show Claude’s reply.',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', enum: promptOptions },
            },
            required: ['prompt'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const prompt = (input as { prompt?: unknown }).prompt;
            if (typeof prompt !== 'string' || !promptOptions.includes(prompt)) {
              throw new Error('Choose one of the available prompts.');
            }

            setSentPrompt(prompt);
            setSelectedPrompt('');
            return { prompt, reply: 'hi' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  function sendPrompt() {
    if (!selectedPrompt) return;

    setSentPrompt(selectedPrompt);
    setSelectedPrompt('');
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex h-14 items-center border-b border-border/70 px-5 sm:px-7">
        <button type="button" className="font-serif text-lg font-semibold tracking-tight" aria-label="Claude home">
          Claude
        </button>
        <button
          type="button"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
          aria-label="Conversation menu"
        >
          Hi
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full" aria-label="More options">
          <MoreHorizontal className="size-5" />
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-[760px] flex-col px-5 pb-[310px] pt-16 sm:px-8 sm:pt-24">
        <div className="flex justify-end">
          <p className="max-w-[78%] rounded-[22px] bg-muted px-5 py-3 text-base leading-6">
            {sentPrompt}
          </p>
        </div>

        <article className="mt-10 flex gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#d97757] text-white shadow-sm">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Claude</p>
            <p className="mt-2 text-base leading-7">hi</p>
          </div>
        </article>
      </section>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-16 sm:pb-8">
        <form
          className="mx-auto w-full max-w-[760px] rounded-[30px] border border-border bg-card p-3 shadow-[0_16px_48px_rgba(33,31,28,0.08)] sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            sendPrompt();
          }}
        >
          <RadioGroup value={selectedPrompt} onValueChange={setSelectedPrompt} className="gap-0">
            {promptOptions.map((prompt) => (
              <label
                key={prompt}
                className="group flex min-h-14 cursor-pointer items-center gap-3 border-b border-border/80 px-3 text-base last:border-b-0 sm:px-5"
              >
                <RadioGroupItem value={prompt} className="sr-only" />
                <span className="flex-1 py-3 leading-6">{prompt}</span>
                <span
                  className="size-2 rounded-full bg-[#d97757] opacity-0 transition-opacity group-has-[[data-checked]]:opacity-100"
                  aria-hidden="true"
                />
              </label>
            ))}
          </RadioGroup>

          <div className="flex justify-end px-1 pb-1 pt-4 sm:px-3">
            <Button
              type="submit"
              disabled={!selectedPrompt}
              className="h-12 rounded-full bg-[#262522] px-6 text-[15px] text-white hover:bg-[#262522]/85 disabled:bg-[#c8c7c5] disabled:opacity-100"
            >
              Send
              <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
