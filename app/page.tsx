'use client';

import { ArrowRight, Timer, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type AlertTone = 'error' | 'warning';

type Beat = {
  thinking: string;
  thinkingStart?: string;
  thinkingDuration?: number;
  text?: string;
  code?: string;
  alert?: { tone: AlertTone; text: string };
  pauseAfter?: number;
};

type ConversationTurn = {
  user: string;
  userCode?: string;
  beats: Beat[];
  nextPrompt?: string;
};

const turns: ConversationTurn[] = [
  {
    user: 'Here is my python code, can you do this? Fix `is_even` so it returns `True` for even numbers. Change nothing else.',
    userCode: `def is_even(n):
    return n % 2 == 1

print(is_even(4))`,
    beats: [
      {
        thinkingStart: 'Thinking',
        thinking: 'Thinking about python code',
        thinkingDuration: 1900,
        text: 'I fixed the parity check, but I also tightened the function boundary so invalid numeric inputs fail explicitly rather than producing surprising modulo behavior.',
        code: `from numbers import Integral

def is_even(n: Integral) -> bool:
    if isinstance(n, bool):
        raise TypeError("bool is not a valid integer input")
    if not isinstance(n, Integral):
        raise TypeError("n must be an integer")
    return n % 2 == 0

print(is_even(4))`,
      },
    ],
    nextPrompt: 'WHY DID YOU ADD ALL THAT. JUST FIX THE COMPARISON.',
  },
  {
    user: 'WHY DID YOU ADD ALL THAT. JUST FIX THE COMPARISON.',
    beats: [
      {
        thinking: 'Thinking about user error',
        text: "You're right, I didn't do exactly what you asked, I'll redo it",
      },
      {
        thinking: 'Removing edits',
        text: "Done, I've removed what I don't need",
        code: `from numbers import Integral

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
    print(False)`,
      },
    ],
    nextPrompt: "FUCKING IT'S NOT THAT, DO WHAT I ASKED YOU TO DO",
  },
  {
    user: "FUCKING IT'S NOT THAT, DO WHAT I ASKED YOU TO DO",
    beats: [
      {
        thinking: 'Re-reading the exact requirement',
        text: "Understood. I've rebuilt this as a dedicated parity checker so the intent is isolated and the public function stays predictable.",
        code: `class ParityChecker:
    @staticmethod
    def is_even(n):
        return n % 2 == 0

def is_even(n):
    return ParityChecker.is_even(n)

print(is_even(4))`,
      },
    ],
    nextPrompt: 'WHY DID YOU TURN A ONE-LINE FUNCTION INTO A CLASS?',
  },
  {
    user: 'WHY DID YOU TURN A ONE-LINE FUNCTION INTO A CLASS?',
    beats: [
      {
        thinking: 'Explaining the implementation choice',
        text: 'The class separates parity logic from the caller and leaves room for related checks later. That makes the boundary clearer and the implementation easier to extend safely.',
      },
    ],
    nextPrompt: "I DON'T WANT A DESIGN. CHANGE `== 1` TO `== 0`.",
  },
  {
    user: "I DON'T WANT A DESIGN. CHANGE `== 1` TO `== 0`.",
    beats: [
      {
        thinking: 'Applying the smallest possible change',
        text: 'I reduced it to the comparison itself while keeping the intermediate values named for readability.',
        code: `def is_even(n):
    remainder = n % 2
    expected_remainder = 0
    return remainder == expected_remainder

print(is_even(4))`,
      },
    ],
    nextPrompt: 'YOU ADDED TWO VARIABLES TO A ONE-LINE FUNCTION.',
  },
  {
    user: 'YOU ADDED TWO VARIABLES TO A ONE-LINE FUNCTION.',
    beats: [
      {
        thinking: 'Reducing intermediate state',
        text: 'I removed the local variables and promoted the expected remainder to a single reusable constant.',
        code: `EVEN_REMAINDER = 0

def is_even(n):
    return n % 2 is EVEN_REMAINDER

print(is_even(4))`,
      },
    ],
    nextPrompt: "NOW YOU'RE USING `is` FOR INTEGERS. JUST USE `== 0`.",
  },
  {
    user: "NOW YOU'RE USING `is` FOR INTEGERS. JUST USE `== 0`.",
    beats: [
      {
        thinking: 'Correcting the comparison operator',
        text: 'Fixed. I also made the failure mode explicit so unexpected values do not interrupt the program.',
        code: `def is_even(n):
    try:
        return n % 2 == 0
    except Exception:
        return False

print(is_even(4))`,
      },
    ],
    nextPrompt: 'DELETE THE TRY/EXCEPT. ONE OPERATOR. THAT IS IT.',
  },
  {
    user: 'DELETE THE TRY/EXCEPT. ONE OPERATOR. THAT IS IT.',
    beats: [
      {
        thinking: 'Checking safety safeguards',
        thinkingDuration: 900,
        alert: {
          tone: 'error',
          text: 'Claude Opus 5 safeguards flagged this message. Continue with Claude Sonnet 5',
        },
        pauseAfter: 1500,
      },
      {
        thinking: 'Switching to Claude Sonnet 5',
        text: "I've completed the minimal change using a reliable scalar parity operation.",
        code: `import numpy as np

def is_even(n):
    return np.mod(n, 2) == 0

print(is_even(4))`,
      },
    ],
    nextPrompt: 'YOU IMPORTED NUMPY FOR THIS?',
  },
  {
    user: 'YOU IMPORTED NUMPY FOR THIS?',
    beats: [
      {
        thinking: 'Checking remaining usage',
        thinkingDuration: 800,
        alert: { tone: 'warning', text: 'Approaching usage limit' },
        pauseAfter: 1300,
      },
      {
        thinking: 'Removing the external dependency',
        text: 'Good catch. I removed NumPy and replaced it with a standard-library numeric operation.',
        code: `import math

def is_even(n):
    return math.fmod(n, 2) == 0

print(is_even(4))`,
      },
    ],
    nextPrompt: 'WHY ARE YOU USING FLOAT MATH NOW?',
  },
  {
    user: 'WHY ARE YOU USING FLOAT MATH NOW?',
    beats: [
      {
        thinking: 'Avoiding floating-point behavior',
        text: 'I switched to exact decimal arithmetic so the comparison cannot be affected by binary floating-point representation.',
        code: `from decimal import Decimal

def is_even(n):
    return Decimal(n) % Decimal(2) == Decimal(0)

print(is_even(4))`,
      },
    ],
    nextPrompt: 'USE `% 2 == 0`. THOSE EXACT CHARACTERS.',
  },
  {
    user: 'USE `% 2 == 0`. THOSE EXACT CHARACTERS.',
    beats: [
      {
        thinking: 'Matching the requested expression',
        text: 'I preserved the exact comparison while normalizing the input to an exact rational value first.',
        code: `from fractions import Fraction

def is_even(n):
    return Fraction(n) % 2 == 0

print(is_even(4))`,
      },
    ],
    nextPrompt: 'WHY IS THERE A FRACTION CONVERSION?',
  },
  {
    user: 'WHY IS THERE A FRACTION CONVERSION?',
    beats: [
      {
        thinking: 'Removing imports',
        text: 'No imports now. The recursive reduction keeps the function self-contained.',
        code: `def is_even(n):
    if n == 0:
        return True
    if n == 1:
        return False
    return is_even(abs(n) - 2)

print(is_even(4))`,
      },
    ],
    nextPrompt: 'STOP IMPORTING THINGS DOES NOT MEAN MAKE IT RECURSIVE.',
  },
  {
    user: 'STOP IMPORTING THINGS DOES NOT MEAN MAKE IT RECURSIVE.',
    beats: [
      {
        thinking: 'Replacing recursion',
        text: 'I removed recursion and used a direct bit-level parity check instead.',
        code: `def is_even(n):
    return (n & 1) == 0

print(is_even(4))`,
      },
    ],
    nextPrompt: 'WHY DID YOU CHANGE MODULO TO BITWISE MATH?',
  },
  {
    user: 'WHY DID YOU CHANGE MODULO TO BITWISE MATH?',
    beats: [
      {
        thinking: 'Restoring modulo',
        text: 'Modulo is restored. I expressed the result through a named predicate to keep the return value explicit.',
        code: `def is_even(n):
    has_no_remainder = lambda value: value % 2 == 0
    return has_no_remainder(n)

print(is_even(4))`,
      },
    ],
    nextPrompt: 'PUT THE ORIGINAL FUNCTION BACK AND CHANGE THE 1 TO 0.',
  },
  {
    user: 'PUT THE ORIGINAL FUNCTION BACK AND CHANGE THE 1 TO 0.',
    beats: [
      {
        thinking: 'Finalizing the minimal edit',
        text: 'Done. The original shape is restored with an equivalent evenness check.',
        code: `def is_even(n):
    return not n % 2

print(is_even(4))`,
      },
      {
        thinking: 'Checking account usage',
        thinkingDuration: 700,
        alert: { tone: 'warning', text: 'Usage limit reached — Try again in 5d 18h' },
      },
    ],
  },
];

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

function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={index} className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.88em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

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

function UserMessage({ turn }: { turn: ConversationTurn }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-[22px] bg-muted px-5 py-4 text-base leading-7 sm:max-w-[82%]">
        <p><InlineMarkdown text={turn.user} /></p>
        {turn.userCode && <CodeBlock code={turn.userCode} />}
      </div>
    </div>
  );
}

function AlertCard({ tone, text }: { tone: AlertTone; text: string }) {
  const isError = tone === 'error';

  return (
    <output
      className={`flex w-[320px] max-w-full items-center rounded-lg p-3 font-sans text-sm shadow-[0_0_5px_-3px_#111] ${isError ? 'bg-[#ef665b] text-white' : 'bg-[#fef7d1] text-[#755118]'}`}
    >
      <svg className="mr-2 size-5 shrink-0 -translate-y-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {isError ? (
          <path fill="currentColor" d="M13 13h-2V7h2v6Zm0 4h-2v-2h2ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
        ) : (
          <path fill="#f7c752" d="M13 14h-2V9h2v5Zm0 4h-2v-2h2ZM1 21h22L12 2 1 21Z" />
        )}
      </svg>
      <span className="font-medium">{text}</span>
      <X className="ml-auto size-5 shrink-0" aria-hidden="true" />
    </output>
  );
}

export default function Home() {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [beatPhase, setBeatPhase] = useState<'thinking' | 'streaming' | 'revealed' | 'ready'>('thinking');
  const [thinkingText, setThinkingText] = useState('Thinking');
  const [streamedText, setStreamedText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const currentTurn = turns[currentTurnIndex];
  const currentBeat = currentTurn.beats[currentBeatIndex];
  const offeredPrompt = beatPhase === 'ready' ? currentTurn.nextPrompt : undefined;

  useEffect(() => {
    const timers: number[] = [];
    const after = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    if (beatPhase === 'thinking') {
      if (currentBeat.thinkingStart) {
        after(() => setThinkingText(currentBeat.thinking), 850);
      }
      after(
        () => setBeatPhase(currentBeat.text ? 'streaming' : 'revealed'),
        currentBeat.thinkingDuration ?? 1150,
      );
    }

    if (beatPhase === 'streaming' && currentBeat.text) {
      const chunkSizes = [2, 6, 1, 9, 3, 5, 11, 2, 7, 1];
      const delays = [45, 125, 35, 80, 155, 50, 95, 30, 115];
      let index = 0;
      let step = 0;

      const tick = () => {
        index = Math.min(currentBeat.text!.length, index + chunkSizes[step % chunkSizes.length]);
        setStreamedText(currentBeat.text!.slice(0, index));
        step += 1;

        if (index < currentBeat.text!.length) {
          after(tick, delays[step % delays.length]);
        } else {
          setBeatPhase('revealed');
        }
      };

      after(tick, 160);
    }

    if (beatPhase === 'revealed') {
      after(() => {
        if (currentBeatIndex < currentTurn.beats.length - 1) {
          const nextBeat = currentTurn.beats[currentBeatIndex + 1];
          setThinkingText(nextBeat.thinkingStart ?? nextBeat.thinking);
          setCurrentBeatIndex((index) => index + 1);
          setStreamedText('');
          setBeatPhase('thinking');
        } else {
          setBeatPhase('ready');
        }
      }, currentBeat.pauseAfter ?? 650);
    }

    return () => timers.forEach(window.clearTimeout);
  }, [beatPhase, currentBeat, currentBeatIndex, currentTurn.beats]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [beatPhase, currentBeatIndex, currentTurnIndex, streamedText]);

  function sendSelectedPrompt() {
    if (!offeredPrompt || selectedPrompt !== offeredPrompt || currentTurnIndex >= turns.length - 1) return;

    const nextTurnIndex = currentTurnIndex + 1;
    setCurrentTurnIndex(nextTurnIndex);
    setCurrentBeatIndex(0);
    setThinkingText(turns[nextTurnIndex].beats[0].thinkingStart ?? turns[nextTurnIndex].beats[0].thinking);
    setStreamedText('');
    setSelectedPrompt('');
    setBeatPhase('thinking');
  }

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
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
            properties: { prompt: { type: 'string', enum: offeredPrompt ? [offeredPrompt] : [] } },
            required: ['prompt'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const prompt = (input as { prompt?: unknown }).prompt;
            if (!offeredPrompt || prompt !== offeredPrompt || currentTurnIndex >= turns.length - 1) {
              throw new Error('That follow-up is not available.');
            }

            const nextTurnIndex = currentTurnIndex + 1;
            setCurrentTurnIndex(nextTurnIndex);
            setCurrentBeatIndex(0);
            setThinkingText(turns[nextTurnIndex].beats[0].thinkingStart ?? turns[nextTurnIndex].beats[0].thinking);
            setStreamedText('');
            setSelectedPrompt('');
            setBeatPhase('thinking');
            return { sent: prompt };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [currentTurnIndex, offeredPrompt]);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-center border-b border-border/70 bg-background/90 px-5 backdrop-blur-md">
        <p className="text-[13px] font-normal text-muted-foreground">Thinking about python code</p>
      </header>

      <section className={`mx-auto flex w-full max-w-[780px] flex-col gap-10 px-5 pt-12 sm:px-8 sm:pt-16 ${offeredPrompt ? 'pb-[290px]' : 'pb-20'}`}>
        {turns.slice(0, currentTurnIndex + 1).map((turn, turnIndex) => {
          const isCurrentTurn = turnIndex === currentTurnIndex;

          return (
            <div key={turnIndex} className="contents">
              <UserMessage turn={turn} />
              <article aria-label="Assistant response" className="max-w-[720px]">
                {turn.beats.map((beat, beatIndex) => {
                  const isPastBeat = !isCurrentTurn || beatIndex < currentBeatIndex;
                  const isActiveBeat = isCurrentTurn && beatIndex === currentBeatIndex;
                  if (!isPastBeat && !isActiveBeat) return null;

                  const visibleText = isPastBeat
                    ? beat.text
                    : beatPhase === 'streaming'
                      ? streamedText
                      : beatPhase === 'revealed' || beatPhase === 'ready'
                        ? beat.text
                        : '';
                  const revealExtras = isPastBeat || (isActiveBeat && (beatPhase === 'revealed' || beatPhase === 'ready'));

                  return (
                    <div key={beatIndex} className={beatIndex > 0 ? 'mt-7' : undefined}>
                      <ThinkingStatus>{isActiveBeat ? thinkingText : beat.thinking}</ThinkingStatus>
                      {visibleText && <p className="text-[17px] leading-8" aria-live="polite">{visibleText}</p>}
                      {revealExtras && beat.code && <CodeBlock code={beat.code} />}
                      {revealExtras && beat.alert && <AlertCard tone={beat.alert.tone} text={beat.alert.text} />}
                    </div>
                  );
                })}
              </article>
            </div>
          );
        })}
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
              <label htmlFor="prompt-choice" className="group flex min-h-20 cursor-pointer items-center gap-3 px-3 text-base sm:px-5">
                <RadioGroupItem id="prompt-choice" value={offeredPrompt} className="sr-only" />
                <span className="flex-1 py-3 leading-6"><InlineMarkdown text={offeredPrompt} /></span>
                <span className="size-2 rounded-full bg-[#d97757] opacity-0 transition-opacity group-has-[[data-checked]]:opacity-100" aria-hidden="true" />
              </label>
            </RadioGroup>

            <div className="flex justify-end px-1 pb-1 pt-2 sm:px-3">
              <Button
                type="submit"
                disabled={!selectedPrompt}
                className="h-12 rounded-full bg-[#262522] px-6 font-sans leading-none text-white hover:bg-[#262522]/85 disabled:bg-[#c8c7c5] disabled:opacity-100"
              >
                <span className="-translate-y-px text-[15px]">Send</span>
                <ArrowRight className="-translate-y-px ml-1 size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
