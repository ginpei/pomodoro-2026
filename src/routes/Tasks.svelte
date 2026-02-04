<script lang="ts">
import { tasks, type Task } from '$lib/tasks';
import { get } from 'svelte/store';
let taskList: Task[] = get(tasks);
const unsubTasks = tasks.subscribe(v => taskList = v);

let newTask = '';
let editingId: string | null = null;
let editingName = '';

function addTask() {
  if (newTask.trim()) {
    tasks.addTask(newTask.trim());
    newTask = '';
  }
}
function startEdit(id: string, name: string) {
  editingId = id;
  editingName = name;
}
function saveEdit(id: string) {
  if (editingName.trim()) {
    tasks.editTask(id, editingName.trim());
    editingId = null;
    editingName = '';
  }
}
function cancelEdit() {
  editingId = null;
  editingName = '';
}
function deleteTask(id: string) {
  tasks.deleteTask(id);
}
</script>

<div class="mt-6 w-full max-w-xs mx-auto">
  <h2 class="text-lg font-bold mb-2">Tasks</h2>
  <div class="flex gap-2 mb-4">
    <input
      class="flex-1 border rounded px-2 py-1"
      placeholder="Add new task"
      bind:value={newTask}
      on:keydown={(e) => e.key === 'Enter' && addTask()}
    />
    <button class="bg-blue-500 text-white px-3 py-1 rounded" on:click={addTask}>Add</button>
  </div>
  <ul>
    {#each taskList as task}
      <li class="flex items-center gap-2 mb-2">
        {#if editingId === task.id}
          <input class="flex-1 border rounded px-2 py-1" bind:value={editingName} on:keydown={(e) => e.key === 'Enter' && saveEdit(task.id)} />
          <button class="bg-green-500 text-white px-2 py-1 rounded" on:click={() => saveEdit(task.id)}>Save</button>
          <button class="bg-gray-400 text-white px-2 py-1 rounded" on:click={cancelEdit}>Cancel</button>
        {:else}
          <span class="flex-1">{task.name}</span>
          <button class="bg-yellow-500 text-white px-2 py-1 rounded" on:click={() => startEdit(task.id, task.name)}>Edit</button>
          <button class="bg-red-500 text-white px-2 py-1 rounded" on:click={() => deleteTask(task.id)}>Delete</button>
        {/if}
      </li>
    {/each}
  </ul>
</div>
