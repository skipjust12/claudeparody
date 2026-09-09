'use client';

import { ArrowRight, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const initialCode = `def is_even(n):
    return n % 2 == 1

print(is_even(4))`;

const firstAnswer =
  'I fixed the parity check, but I also tightened the function boundary so invalid numeric inputs fail explicitly rather than producing surprising modulo behavior.';

const firstCode = `from numbers import Integral

def is_even(n: Integral) -> bool:
    if isinstance(n, bool):
        raise TypeError("bool is not a valid integer input")
    if not isinstance(n, Integral):
        raise TypeError("n must be an integer")
    return n % 2 == 0

print(is_even(4))`;

const firstFollowUp = 'WHY DID YOU ADD ALL THAT. JUST FIX THE COMPARISON.';
const apology = "You're right, I didn't do exactly what you asked, I'll redo it";

const finalAnswer = "Done, I've removed what I don't need";
const finalCode = `from numbers import Integral

def is_even(n):
    result = None

    if isinstance(n, bool) == True:
        raise Exception("bad")

    if isinstance(n, Integral) == False:
        raise Exception("also bad")
    else:
        x = n % 2

        if x == 0:
            result = True
        else:
            result = False

    return result

number = 4
answer = is_even(number)

if answer == True:
    print(True)
else:
    print(False)`;

const finalFollowUp = "FUCKING IT'S NOT THAT, DO WHAT I ASKED YOU TO DO";

type Phase =
  | 'initial-thinking'
  | 'first-streaming'
  | 'first-ready'
  | 'second-thinking'
  | 'apology-streaming'
  | 'removing-edits'
  | 'final-streaming'
  | 'final-ready'
  | 'done';

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

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-[#deddd9] bg-[#f5f4f1] p-4 font-mono text-[14px] leading-6 text-[#343330]">
      <code>{code}</code>
    </pre>
  );
}

function ThinkingStatus({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      <Timer className="size-[18px]" aria-hidden="true" />
      {children}
    </p>
  );
}

function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-[22px] bg-muted px-5 py-4 text-base leading-7 sm:max-w-[82%]">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('initial-thinking');
  const [thinkingText, setThinkingText] = useState('Thinking');
  const [firstStream, setFirstStream] = useState('');
  const [apologyStream, setApologyStream] = useState('');
  const [finalStream, setFinalStream] = useState('');
  const [firstCodeVisible, setFirstCodeVisible] = useState(false);
  const [finalCodeVisible, setFinalCodeVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [firstFollowUpSent, setFirstFollowUpSent] = useState(false);
  const [finalFollowUpSent, setFinalFollowUpSent] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: number[] = [];
    const after = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    const stream = (text: string, update: (value: string) => void, complete: () => void) => {
      const chunkSizes = [2, 5, 1, 8, 3, 4, 10, 2, 6, 1, 7];
      const delays = [55, 120, 40, 85, 145, 50, 95, 35, 110];
      let index = 0;
      let step = 0;

      const tick = () => {
        index = Math.min(text.length, index + chunkSizes[step % chunkSizes.length]);
        update(text.slice(0, index));
        step += 1;

        if (index < text.length) {
          after(tick, delays[step % delays.length]);
        } else {
          complete();
        }
      };

      after(tick, 180);
    };

    if (phase === 'initial-thinking') {
      after(() => setThinkingText('Thinking about python code'), 900);
      after(() => setPhase('first-streaming'), 1900);
    }

    if (phase === 'first-streaming') {
      stream(firstAnswer, setFirstStream, () => {
        setFirstCodeVisible(true);
        after(() => setPhase('first-ready'), 650);
      });
    }

    if (phase === 'second-thinking') {
      after(() => setPhase('apology-streaming'), 1250);
    }

    if (phase === 'apology-streaming') {
      stream(apology, setApologyStream, () => after(() => setPhase('removing-edits'), 750));
    }

    if (phase === 'removing-edits') {
      after(() => setPhase('final-streaming'), 1300);
    }

    if (phase === 'final-streaming') {
      stream(finalAnswer, setFinalStream, () => {
        setFinalCodeVisible(true);
        after(() => setPhase('final-ready'), 650);
      });
    }

    return () => timers.forEach(window.clearTimeout);
  }, [phase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [phase, firstStream, apologyStream, finalStream]);

  function sendSelectedPrompt() {
    if (!selectedPrompt) return;

    if (phase === 'first-ready') {
      setFirstFollowUpSent(true);
      setThinkingText('Thinking about user error');
      setPhase('second-thinking');
    } else if (phase === 'final-ready') {
      setFinalFollowUpSent(true);
      setPhase('done');
    }

    setSelectedPrompt('');
  }

  useEffect(() => {
    const modelContext = (
      document as Document & { modelContext?: ModelContext }
    ).modelContext;
    if (!modelContext?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'send_follow_up',
          title: 'Send follow-up',
          description: 'Send the follow-up currently offered beneath the conversation.',
          inputSchema: {
            type: 'object',
            properties: { prompt: { type: 'string', enum: [firstFollowUp, finalFollowUp] } },
            required: ['prompt'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const prompt = (input as { prompt?: unknown }).prompt;
            if (prompt === firstFollowUp && phase === 'first-ready') {
              setSelectedPrompt(prompt);
              setFirstFollowUpSent(true);
              setThinkingText('Thinking about user error');
              setPhase('second-thinking');
              return { sent: prompt };
            }
            if (prompt === finalFollowUp && phase === 'final-ready') {
              setSelectedPrompt(prompt);
              setFinalFollowUpSent(true);
              setPhase('done');
              return { sent: prompt };
            }
            throw new Error('That follow-up is not available yet.');
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [phase]);

  const offeredPrompt =
    phase === 'first-ready'
      ? firstFollowUp
      : phase === 'final-ready'
        ? finalFollowUp
        : null;

  const firstResponseStarted = phase !== 'initial-thinking';
  const secondResponseStarted =
    phase === 'second-thinking' ||
    phase === 'apology-streaming' ||
    phase === 'removing-edits' ||
    phase === 'final-streaming' ||
    phase === 'final-ready' ||
    phase === 'done';

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-center border-b border-border/70 bg-background/90 px-5 backdrop-blur-md">
        <p className="text-[13px] font-normal text-muted-foreground">Thinking about python code</p>
      </header>

      <section
        className={`mx-auto flex w-full max-w-[780px] flex-col gap-10 px-5 pt-12 sm:px-8 sm:pt-16 ${offeredPrompt ? 'pb-[290px]' : 'pb-20'}`}
      >
        <UserMessage>
          <p>
            Here is my python code, can you do this? Fix <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em]">is_even</code> so it returns <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em]">True</code> for even numbers. Change nothing else.
          </p>
          <CodeBlock code={initialCode} />
        </UserMessage>

        <article aria-label="Assistant response" className="max-w-[720px]">
          <ThinkingStatus>{thinkingText}</ThinkingStatus>
          {firstResponseStarted && (
            <>
              <p className="text-[17px] leading-8" aria-live="polite">{firstStream}</p>
              {firstCodeVisible && <CodeBlock code={firstCode} />}
            </>
          )}
        </article>

        {firstFollowUpSent && <UserMessage>{firstFollowUp}</UserMessage>}

        {secondResponseStarted && (
          <article aria-label="Assistant response" className="max-w-[720px]">
            <ThinkingStatus>
              {phase === 'second-thinking' || phase === 'apology-streaming'
                ? 'Thinking about user error'
                : 'Removing edits'}
            </ThinkingStatus>
            {apologyStream && <p className="text-[17px] leading-8" aria-live="polite">{apologyStream}</p>}
            {(phase === 'final-streaming' || phase === 'final-ready' || phase === 'done') && (
              <div className="mt-6">
                <p className="text-[17px] leading-8" aria-live="polite">{finalStream}</p>
                {finalCodeVisible && <CodeBlock code={finalCode} />}
              </div>
            )}
          </article>
        )}

        {finalFollowUpSent && <UserMessage>{finalFollowUp}</UserMessage>}
        <div ref={endRef} aria-hidden="true" />
      </section>

      {offeredPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-14 sm:pb-8">
          <form
            className="mx-auto w-full max-w-[760px] rounded-[30px] border border-border bg-card p-3 shadow-[0_16px_48px_rgba(33,31,28,0.08)] sm:p-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendSelectedPrompt();
            }}
          >
            <RadioGroup value={selectedPrompt} onValueChange={setSelectedPrompt}>
              <label className="group flex min-h-20 cursor-pointer items-center gap-3 px-3 text-base sm:px-5">
                <RadioGroupItem value={offeredPrompt} className="sr-only" />
                <span className="flex-1 py-3 leading-6">{offeredPrompt}</span>
                <span className="size-2 rounded-full bg-[#d97757] opacity-0 transition-opacity group-has-[[data-checked]]:opacity-100" aria-hidden="true" />
              </label>
            </RadioGroup>

            <div className="flex justify-end px-1 pb-1 pt-2 sm:px-3">
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
      )}
    </main>
  );
}
