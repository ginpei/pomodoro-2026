<script lang="ts">
import { DEFAULT_BREAK_DURATION, timer, type TimerState } from '$lib/timer';
import { selectedTaskId, tasks, type Task } from '$lib/tasks';
import { onDestroy, onMount } from 'svelte';
import { get } from 'svelte/store';
let timerValue = get(timer);
let taskList: Task[] = [];
let activeTaskId: string | null = null;
let activeTask: Task | null = null;
let hydrated = false;
let dragPreview: TimerState | null = null;
let dragActive = false;
let dragCanceled = false;
let dragPointerId: number | null = null;
let dragProgress: number | null = null;
let dragBaseState: TimerState | null = null;
const CENTER = 80;
const RADIUS = 70;
const SECOND_RADIUS = 56;
const OUTSIDE_THRESHOLD = 48;
onMount(() => {
  timer.restore();
  hydrated = true;
});
const unsubscribe = timer.subscribe(value => timerValue = value);
const unsubscribeTasks = tasks.subscribe(value => taskList = value);
const unsubscribeSelected = selectedTaskId.subscribe(value => activeTaskId = value);
onDestroy(() => {
  unsubscribe();
  unsubscribeTasks();
  unsubscribeSelected();
});

$: activeTask = taskList.find(task => task.id === activeTaskId) ?? null;

function start() { timer.start(); }
function pause() { timer.pause(); }
function reset() { timer.reset(); }


function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getHandProgress(state: TimerState) {
  const workLength = state.workDuration;
  const breakLength = DEFAULT_BREAK_DURATION;
  const totalLength = workLength + breakLength;
  if (state.mode === 'break') {
    return (workLength + (breakLength - state.remaining)) / totalLength;
  }
  return (workLength - state.remaining) / totalLength;
}

function getSecondHandProgress(state: TimerState) {
  const secondsInMinute = ((state.remaining % 60) + 60) % 60;
  return ((60 - secondsInMinute) % 60) / 60;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getProgressFromEvent(event: PointerEvent) {
  const target = event.currentTarget as SVGSVGElement;
  const rect = target.getBoundingClientRect();
  const scaleX = 160 / rect.width;
  const scaleY = 160 / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const dx = x - CENTER;
  const dy = y - CENTER;
  const distance = Math.hypot(dx, dy);
  let angleFromTop = Math.atan2(dy, dx) + Math.PI / 2;
  if (angleFromTop < 0) angleFromTop += Math.PI * 2;
  const progress = angleFromTop / (Math.PI * 2);
  return { distance, progress };
}

function deriveStateForProgress(state: TimerState, progress: number): TimerState {
  const clamped = clamp(progress, 0, 1);
  const totalDuration = state.workDuration + DEFAULT_BREAK_DURATION;
  const elapsed = clamped * totalDuration;
  if (elapsed <= state.workDuration) {
    const remaining = clamp(Math.round(state.workDuration - elapsed), 0, state.workDuration);
    return { ...state, mode: 'work', duration: state.workDuration, remaining };
  }
  const breakElapsed = elapsed - state.workDuration;
  const remaining = clamp(Math.round(DEFAULT_BREAK_DURATION - breakElapsed), 0, DEFAULT_BREAK_DURATION);
  return { ...state, mode: 'break', duration: DEFAULT_BREAK_DURATION, remaining };
}

function startDrag(event: PointerEvent) {
  const { distance, progress } = getProgressFromEvent(event);
  if (distance > RADIUS + OUTSIDE_THRESHOLD) return;
  dragActive = true;
  dragCanceled = false;
  dragPointerId = event.pointerId;
  dragBaseState = { ...timerValue };
  dragProgress = progress;
  dragPreview = deriveStateForProgress(dragBaseState, progress);
  (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
}

function updateDrag(event: PointerEvent) {
  if (!dragActive || dragPointerId !== event.pointerId) return;
  const { distance, progress } = getProgressFromEvent(event);
  if (distance > RADIUS + OUTSIDE_THRESHOLD) {
    dragCanceled = true;
    dragPreview = null;
    dragProgress = null;
  } else {
    dragCanceled = false;
    dragProgress = progress;
    dragPreview = deriveStateForProgress(dragBaseState ?? timerValue, progress);
  }
}

function endDrag(event: PointerEvent) {
  if (!dragActive || dragPointerId !== event.pointerId) return;
  (event.currentTarget as SVGSVGElement).releasePointerCapture(event.pointerId);
  if (!dragCanceled && dragProgress != null) {
    timer.setProgress(dragProgress);
  }
  dragActive = false;
  dragCanceled = false;
  dragPointerId = null;
  dragProgress = null;
  dragPreview = null;
  dragBaseState = null;
}

function cancelDrag(event: PointerEvent) {
  if (!dragActive || dragPointerId !== event.pointerId) return;
  (event.currentTarget as SVGSVGElement).releasePointerCapture(event.pointerId);
  dragActive = false;
  dragCanceled = false;
  dragPointerId = null;
  dragProgress = null;
  dragPreview = null;
  dragBaseState = null;
}

$: displayValue = dragPreview ?? timerValue;
$: workDuration = displayValue.workDuration;
$: breakDuration = DEFAULT_BREAK_DURATION;
$: totalDuration = workDuration + breakDuration;
$: workDash = 2 * Math.PI * RADIUS * (workDuration / totalDuration);
$: breakDash = 2 * Math.PI * RADIUS * (breakDuration / totalDuration);

</script>

{#if !hydrated}
  <div class="flex flex-col items-center gap-4">
    <svg width="160" height="160" viewBox="0 0 160 160" class="mb-2 animate-pulse">
      <circle
        cx="80" cy="80" r="70"
        fill="none"
        stroke="#d1d5db"
        stroke-width="12"
      />
    </svg>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded bg-green-500 text-white disabled:bg-green-200 disabled:opacity-60" disabled>Start</button>
      <button class="px-4 py-2 rounded bg-yellow-500 text-white disabled:bg-yellow-200 disabled:opacity-60" disabled>Pause</button>
      <button class="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-60" disabled>Reset</button>
    </div>
    <div class="text-gray-300 animate-pulse">Task: --</div>
  </div>
{:else}
  <div class="flex flex-col items-center gap-4">
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      class="mb-2 touch-none select-none"
      role="slider"
      aria-label="Timer progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="{Math.round(getHandProgress(displayValue) * 100)}"
      tabindex="0"
      on:pointerdown={startDrag}
      on:pointermove={updateDrag}
      on:pointerup={endDrag}
      on:pointercancel={cancelDrag}
    >
      <circle
        cx="{CENTER}" cy="{CENTER}" r="{RADIUS}"
        fill="none"
        stroke="#3b82f6"
        stroke-width="12"
        stroke-dasharray="{workDash} {breakDash}"
        stroke-dashoffset="0"
        transform="rotate(-90 80 80)"
      />
      <circle
        cx="{CENTER}" cy="{CENTER}" r="{RADIUS}"
        fill="none"
        stroke="#f59e42"
        stroke-width="12"
        stroke-dasharray="{breakDash} {workDash}"
        stroke-dashoffset="-{workDash}"
        transform="rotate(-90 80 80)"
      />
      <line
        x1="{CENTER}"
        y1="{CENTER}"
        x2="{CENTER + RADIUS * Math.cos(2 * Math.PI * (getHandProgress(displayValue)) - Math.PI / 2)}"
        y2="{CENTER + RADIUS * Math.sin(2 * Math.PI * (getHandProgress(displayValue)) - Math.PI / 2)}"
        stroke="#ef4444"
        stroke-width="6"
        stroke-linecap="round"
      />
      <line
        x1="{CENTER}"
        y1="{CENTER}"
        x2="{CENTER + SECOND_RADIUS * Math.cos(2 * Math.PI * (getSecondHandProgress(displayValue)) - Math.PI / 2)}"
        y2="{CENTER + SECOND_RADIUS * Math.sin(2 * Math.PI * (getSecondHandProgress(displayValue)) - Math.PI / 2)}"
        stroke="#111827"
        stroke-width="2"
        stroke-linecap="round"
      />
      <text x="{CENTER}" y="{CENTER + 10}" text-anchor="middle" font-size="32" fill="#111827">{format(displayValue.remaining)}</text>
    </svg>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded bg-green-500 text-white disabled:bg-green-200" on:click={start} disabled={timerValue.running}>Start</button>
      <button class="px-4 py-2 rounded bg-yellow-500 text-white disabled:bg-yellow-200" on:click={pause} disabled={!timerValue.running}>Pause</button>
      <button class="px-4 py-2 rounded bg-red-500 text-white" on:click={reset}>Reset</button>
    </div>
    <div class="text-sm text-gray-700">Task: {activeTask ? activeTask.name : 'None'}</div>
    
  </div>
{/if}
