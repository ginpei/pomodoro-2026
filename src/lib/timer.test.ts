import { createTimerStore, type TimerState } from './timer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage() {
  let state: Partial<TimerState> | null = null;
  return {
    load() {
      return state;
    },
    save(next: TimerState) {
      state = { ...next };
    },
    setRaw(next: Partial<TimerState> | null) {
      state = next;
    },
    clear() {
      state = null;
    }
  };
}

describe('timer logic', () => {
  let storage: ReturnType<typeof createMemoryStorage>;
  let timer: ReturnType<typeof createTimerStore>;

  beforeEach(() => {
    storage = createMemoryStorage();
    timer = createTimerStore({ storage });
    timer.setMode('work', 10);
    timer.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct state', () => {
    let state: TimerState | undefined;
    const unsub = timer.subscribe(s => (state = s));
    unsub();
    expect(state!.mode).toBe('work');
    expect(state!.duration).toBe(10);
    expect(state!.remaining).toBe(10);
    expect(state!.running).toBe(false);
  });

  it('should start and count down', () => {
    vi.useFakeTimers();
    timer.start();
    vi.advanceTimersByTime(1200);
    let state: TimerState | undefined;
    const unsub = timer.subscribe(s => (state = s));
    unsub();
    expect(state!.running).toBe(true);
    expect(state!.remaining).toBeLessThan(10);
    timer.reset();
  });

  it('should pause and reset', () => {
    timer.start();
    timer.pause();
    let state: TimerState | undefined;
    const unsub = timer.subscribe(s => (state = s));
    unsub();
    expect(state!.running).toBe(false);
    timer.reset();
    let resetState: TimerState | undefined;
    const resetUnsub = timer.subscribe(s => (resetState = s));
    resetUnsub();
    expect(resetState!.remaining).toBe(10);
  });

  it('restores running timer using start time', () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(now);
    storage.setRaw({
      mode: 'work',
      duration: 10,
      remaining: 10,
      running: true,
      startTime: now.getTime() - 5000,
      workDuration: 10
    });
    timer.restore();
    let state: TimerState | undefined;
    const unsub = timer.subscribe(s => (state = s));
    unsub();
    expect(state!.remaining).toBe(5);
    expect(state!.running).toBe(true);
    timer.reset();
  });
});
