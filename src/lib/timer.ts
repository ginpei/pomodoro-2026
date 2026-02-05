// Timer logic for Pomodoro
import { writable, type Writable } from 'svelte/store';

export type TimerMode = 'work' | 'break' | 'custom';

const DEFAULT_WORK_DURATION = 1500;
const DEFAULT_BREAK_DURATION = 300;

export interface TimerState {
  mode: TimerMode;
  duration: number; // seconds
  remaining: number; // seconds
  running: boolean;
  workDuration: number; // seconds
  workMode: 'work' | 'custom';
}

function createTimer() {
  const STORAGE_KEY = 'pomodoro-timer-state';
  function loadState(): TimerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TimerState>;
        const mode: TimerMode =
          parsed.mode === 'work' || parsed.mode === 'break' || parsed.mode === 'custom'
            ? parsed.mode
            : 'work';
        const workMode =
          parsed.workMode === 'custom' || parsed.workMode === 'work'
            ? parsed.workMode
            : mode === 'custom'
              ? 'custom'
              : 'work';
        const workDuration =
          typeof parsed.workDuration === 'number'
            ? parsed.workDuration
            : mode === 'break'
              ? DEFAULT_WORK_DURATION
              : typeof parsed.duration === 'number'
                ? parsed.duration
                : DEFAULT_WORK_DURATION;
        const duration =
          typeof parsed.duration === 'number'
            ? parsed.duration
            : mode === 'break'
              ? DEFAULT_BREAK_DURATION
              : workDuration;
        const remaining =
          typeof parsed.remaining === 'number'
            ? parsed.remaining
            : duration;
        const running = typeof parsed.running === 'boolean' ? parsed.running : false;
        return { mode, duration, remaining, running, workDuration, workMode };
      }
    } catch {}
    return {
      mode: 'work',
      duration: DEFAULT_WORK_DURATION,
      remaining: DEFAULT_WORK_DURATION,
      running: false,
      workDuration: DEFAULT_WORK_DURATION,
      workMode: 'work'
    };
  }
  function saveState(state: TimerState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  const { subscribe, set, update }: Writable<TimerState> = writable(loadState());
  let interval: ReturnType<typeof setInterval> | null = null;

  subscribe(saveState);

  function transitionPhase(state: TimerState): TimerState {
    if (state.mode === 'break') {
      return {
        ...state,
        mode: state.workMode,
        duration: state.workDuration,
        remaining: state.workDuration,
        running: false
      };
    }
    return {
      ...state,
      mode: 'break',
      duration: DEFAULT_BREAK_DURATION,
      remaining: DEFAULT_BREAK_DURATION,
      running: true
    };
  }

  function tick(state: TimerState): TimerState {
    if (!state.running) return state;
    if (state.remaining > 1) {
      return { ...state, remaining: state.remaining - 1 };
    }
    return transitionPhase(state);
  }

  function start() {
    console.log('[timer] start called');
    update(state => {
      if (interval == null && state.remaining > 0) {
        // Start interval if not already started and timer should be running
        console.log('[timer] starting interval');
        interval = setInterval(() => {
          update(s => {
            const next = tick(s);
            console.log('[timer] tick', next);
            saveState(next);
            if (!next.running && interval) {
              console.log('[timer] clearing interval');
              clearInterval(interval);
              interval = null;
            }
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
      const next = {
        ...state,
        mode: state.workMode,
        duration: state.workDuration,
        remaining: state.workDuration,
        running: false
      };
      console.log('[timer] set stopped', next);
      saveState(next);
      return next;
    });
  }

  function setMode(mode: TimerMode, duration: number) {
    console.log('[timer] setMode called', mode, duration);
    pause();
    update(state => {
      const next = {
        ...state,
        mode,
        duration,
        remaining: duration,
        running: false,
        workMode: mode === 'break' ? state.workMode : (mode === 'custom' ? 'custom' : 'work'),
        workDuration: mode === 'break' ? state.workDuration : duration
      };
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
