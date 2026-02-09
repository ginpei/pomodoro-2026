import { writable, type Writable } from 'svelte/store';
import {
  DEFAULT_BREAK_DURATION,
  DEFAULT_WORK_DURATION,
  normalizeTimerState,
  pauseTimer,
  resetTimer,
  setModeTimer,
  setProgressTimer,
  startTimer,
  tickTimer,
  type TimerMode,
  type TimerState
} from './timer-model';

export {
  DEFAULT_BREAK_DURATION,
  DEFAULT_WORK_DURATION,
  type TimerMode,
  type TimerState
} from './timer-model';

export interface TimerStorage {
  load(): Partial<TimerState> | null;
  save(state: TimerState): void;
}

export interface IntervalAdapter {
  set(handler: () => void, ms: number): ReturnType<typeof setInterval>;
  clear(id: ReturnType<typeof setInterval>): void;
}

export interface TimerStoreOptions {
  storage?: TimerStorage;
  now?: () => number;
  interval?: IntervalAdapter;
}

const STORAGE_KEY = 'pomodoro-timer-state';

function createNoopTimerStorage(): TimerStorage {
  return {
    load() {
      return null;
    },
    save() {}
  };
}

function createBrowserTimerStorage(): TimerStorage {
  if (typeof window === 'undefined') {
    return createNoopTimerStorage();
  }
  const storage = window.localStorage;
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<TimerState>) : null;
    },
    save(state) {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  };
}

const defaultInterval: IntervalAdapter = {
  set(handler, ms) {
    return setInterval(handler, ms);
  },
  clear(id) {
    clearInterval(id);
  }
};

export function createTimerStore(options: TimerStoreOptions = {}) {
  const storage = options.storage ?? createBrowserTimerStorage();
  const now = options.now ?? (() => Date.now());
  const intervalApi = options.interval ?? defaultInterval;

  const initial = normalizeTimerState(storage.load(), now());
  const { subscribe, set, update }: Writable<TimerState> = writable(initial);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function persist(state: TimerState) {
    storage.save(state);
  }

  function stopInterval() {
    if (intervalId == null) return;
    intervalApi.clear(intervalId);
    intervalId = null;
  }

  function ensureInterval() {
    if (intervalId != null) return;
    intervalId = intervalApi.set(() => {
      update(state => {
        const next = tickTimer(state, now());
        persist(next);
        if (!next.running && intervalId) {
          stopInterval();
        }
        return next;
      });
    }, 1000);
  }

  function start() {
    update(state => {
      const next = startTimer(state, now());
      if (next.remaining > 0) {
        ensureInterval();
      }
      persist(next);
      return next;
    });
  }

  function pause() {
    update(state => {
      stopInterval();
      const next = pauseTimer(state, now());
      persist(next);
      return next;
    });
  }

  function reset() {
    pause();
    update(state => {
      const next = resetTimer(state);
      persist(next);
      return next;
    });
  }

  function setMode(mode: TimerMode, duration: number) {
    pause();
    update(state => {
      const next = setModeTimer(state, mode, duration);
      persist(next);
      return next;
    });
  }

  function setProgress(progress: number) {
    update(state => {
      const next = setProgressTimer(state, progress, now());
      if (next.running && intervalId == null && next.remaining > 0) {
        ensureInterval();
      }
      persist(next);
      return next;
    });
  }

  function restore() {
    const state = normalizeTimerState(storage.load(), now());
    set(state);
    if (state.running && state.remaining > 0) {
      persist(state);
      ensureInterval();
    }
  }

  persist(initial);

  return {
    subscribe,
    start,
    pause,
    reset,
    setMode,
    setProgress,
    restore
  };
}

export const timer = createTimerStore();
