// Timer logic for Pomodoro
import { writable, type Writable } from 'svelte/store';

export type TimerMode = 'work' | 'break' | 'custom';

export interface TimerState {
  mode: TimerMode;
  duration: number; // seconds
  remaining: number; // seconds
  running: boolean;
}

function createTimer() {
  const STORAGE_KEY = 'pomodoro-timer-state';
  function loadState(): TimerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      mode: 'work',
      duration: 1500,
      remaining: 1500,
      running: false
    };
  }
  function saveState(state: TimerState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  const { subscribe, set, update }: Writable<TimerState> = writable(loadState());
  let interval: ReturnType<typeof setInterval> | null = null;

  subscribe(saveState);

  function start() {
    console.log('[timer] start called');
    update(state => {
      if ((state.running || !state.running) && interval == null && state.remaining > 0) {
        // Start interval if not already started and timer should be running
        console.log('[timer] starting interval');
        interval = setInterval(() => {
          update(s => {
            const next = s.running && s.remaining > 0
              ? { ...s, remaining: s.remaining - 1 }
              : { ...s, running: false };
            console.log('[timer] tick', next);
            saveState(next);
            if (!next.running || next.remaining <= 0) stop();
            return next;
          });
        }, 1000);
      }
      const next = { ...state, running: true };
      console.log('[timer] set running', next);
      saveState(next);
      return next;
    });
  }

  function pause() {
    console.log('[timer] pause called');
    update(state => {
      if (state.running && interval) {
        console.log('[timer] clearing interval');
        clearInterval(interval);
        interval = null;
      }
      const next = { ...state, running: false };
      console.log('[timer] set paused', next);
      saveState(next);
      return next;
    });
  }

  function stop() {
    console.log('[timer] stop called');
    pause();
    update(state => {
      const next = { ...state, remaining: state.duration, running: false };
      console.log('[timer] set stopped', next);
      saveState(next);
      return next;
    });
  }

  function setMode(mode: TimerMode, duration: number) {
    console.log('[timer] setMode called', mode, duration);
    pause();
    update(state => {
      const next = { ...state, mode, duration, remaining: duration, running: false };
      console.log('[timer] set mode', next);
      saveState(next);
      return next;
    });
  }

  function setCustom(duration: number) {
    setMode('custom', duration);
  }

  return {
    subscribe,
    start,
    pause,
    stop,
    setMode,
    setCustom,
    restore() {
      const state = loadState();
      console.log('[timer] restore called', state);
      set(state);
      if (state.running && state.remaining > 0) {
        console.log('[timer] auto-resume');
        saveState(state);
        start();
      }
    }
  };
}

export const timer = createTimer();
