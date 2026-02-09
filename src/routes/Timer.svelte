<script lang="ts">
import { timer } from '$lib/timer';
import { selectedTaskId, tasks, type Task } from '$lib/tasks';
import { onDestroy, onMount } from 'svelte';
import { get } from 'svelte/store';
let timerValue = get(timer);
let taskList: Task[] = [];
let activeTaskId: string | null = null;
let activeTask: Task | null = null;
let hydrated = false;
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
function stop() { timer.stop(); }


function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getHandProgress(timerValue: any) {
  const workLength = 1500;
  const breakLength = 300;
  const totalLength = workLength + breakLength;
  if (timerValue.mode === 'work') {
    return (workLength - timerValue.remaining) / totalLength;
  } else if (timerValue.mode === 'break') {
    return (workLength + (breakLength - timerValue.remaining)) / totalLength;
  }
  return 0;
}

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
      <button class="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-60" disabled>Stop</button>
    </div>
    <div class="text-gray-300 animate-pulse">Task: --</div>
  </div>
{:else}
  <div class="flex flex-col items-center gap-4">
    <svg width="160" height="160" viewBox="0 0 160 160" class="mb-2">
      <circle
        cx="80" cy="80" r="70"
        fill="none"
        stroke="#3b82f6"
        stroke-width="12"
        stroke-dasharray="{2 * Math.PI * 70 * (1500 / 1800)} {2 * Math.PI * 70 * (300 / 1800)}"
        stroke-dashoffset="0"
        transform="rotate(-90 80 80)"
      />
      <circle
        cx="80" cy="80" r="70"
        fill="none"
        stroke="#f59e42"
        stroke-width="12"
        stroke-dasharray="{2 * Math.PI * 70 * (300 / 1800)} {2 * Math.PI * 70 * (1500 / 1800)}"
        stroke-dashoffset="-{2 * Math.PI * 70 * (1500 / 1800)}"
        transform="rotate(-90 80 80)"
      />
      <line
        x1="80"
        y1="80"
        x2="{80 + 70 * Math.cos(2 * Math.PI * (getHandProgress(timerValue)) - Math.PI / 2)}"
        y2="{80 + 70 * Math.sin(2 * Math.PI * (getHandProgress(timerValue)) - Math.PI / 2)}"
        stroke="#ef4444"
        stroke-width="6"
        stroke-linecap="round"
      />
      <text x="80" y="90" text-anchor="middle" font-size="32" fill="#111827">{format(timerValue.remaining)}</text>
    </svg>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded bg-green-500 text-white disabled:bg-green-200" on:click={start} disabled={timerValue.running}>Start</button>
      <button class="px-4 py-2 rounded bg-yellow-500 text-white disabled:bg-yellow-200" on:click={pause} disabled={!timerValue.running}>Pause</button>
      <button class="px-4 py-2 rounded bg-red-500 text-white" on:click={stop}>Stop</button>
    </div>
    <div class="text-sm text-gray-700">Task: {activeTask ? activeTask.name : 'None'}</div>
    
  </div>
{/if}
