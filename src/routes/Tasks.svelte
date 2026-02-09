<script lang="ts">
import { taskStore, type Task } from '$lib/tasks';
import { get } from 'svelte/store';
const initial = get(taskStore);
let taskList: Task[] = initial.tasks;
let activeTaskId: string | null = initial.selectedTaskId;
let hydrated = false;
const unsubTasks = taskStore.subscribe(v => {
  taskList = v.tasks;
  activeTaskId = v.selectedTaskId;
});
onMount(() => {
  hydrated = true;
});

import { onDestroy, onMount, tick } from 'svelte';
let newTask = '';
let editingId: string | null = null;
let editingName = '';
let newTaskInput: HTMLInputElement;
let editInputs: Record<string, HTMLInputElement> = {};

onDestroy(() => {
  unsubTasks();
});

async function addTask() {
  if (newTask.trim()) {
    taskStore.addTask(newTask.trim());
    newTask = '';
    await tick();
    newTaskInput?.focus();
  }
}
async function startEdit(id: string, name: string) {
  editingId = id;
  editingName = name;
  await tick();
  const input = editInputs[id];
  if (input) {
    input.focus();
    input.select();
  }
}
function saveEdit(id: string) {
  if (editingName.trim()) {
    taskStore.editTask(id, editingName.trim());
    editingId = null;
    editingName = '';
  }
}
function cancelEdit() {
  editingId = null;
  editingName = '';
}
function deleteTask(id: string) {
  taskStore.deleteTask(id);
}
function toggleSelect(id: string) {
  taskStore.selectTask(activeTaskId === id ? null : id);
}
</script>

<div class="mt-6 w-full max-w-xs mx-auto">
  <h2 class="text-lg font-bold mb-2">Tasks</h2>
  <div class="flex gap-2 mb-4">
    <input
      class="flex-1 border rounded px-2 py-1"
      placeholder="Add new task"
      bind:value={newTask}
      bind:this={newTaskInput}
      on:keydown={(e) => e.key === 'Enter' && addTask()}
    />
    <button class="bg-blue-500 text-white px-3 py-1 rounded" on:click={addTask}>Add</button>
  </div>
  <ul>
    {#if !hydrated}
      {#each Array(3) as _}
        <li class="flex items-center gap-2 mb-2 animate-pulse">
          <span class="flex-1 h-6 bg-gray-300 rounded"></span>
          <span class="w-16 h-6 bg-gray-300 rounded"></span>
          <span class="w-16 h-6 bg-gray-300 rounded"></span>
        </li>
      {/each}
    {:else}
      {#each taskList as task}
        <li class="flex items-center gap-2 mb-2">
          {#if editingId === task.id}
            <input class="flex-1 border rounded px-2 py-1" bind:value={editingName} bind:this={editInputs[task.id]} on:keydown={(e) => e.key === 'Enter' && saveEdit(task.id)} />
            <button class="bg-green-500 text-white px-2 py-1 rounded" on:click={() => saveEdit(task.id)}>Save</button>
            <button class="bg-gray-400 text-white px-2 py-1 rounded" on:click={cancelEdit}>Cancel</button>
          {:else}
            <span class="flex-1">{task.name}</span>
            <button
              class={`px-2 py-1 rounded text-white ${activeTaskId === task.id ? 'bg-blue-600' : 'bg-blue-500'}`}
              on:click={() => toggleSelect(task.id)}
            >
              {activeTaskId === task.id ? 'Active' : 'Select'}
            </button>
            <button class="bg-yellow-500 text-white px-2 py-1 rounded" on:click={() => startEdit(task.id, task.name)}>Edit</button>
            <button class="bg-red-500 text-white px-2 py-1 rounded" on:click={() => deleteTask(task.id)}>Delete</button>
          {/if}
        </li>
      {/each}
    {/if}
  </ul>
</div>
