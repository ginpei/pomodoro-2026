<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { Task } from '$lib/tasks';

  export let tasks: Task[] = [];
  export let activeTaskId: string | null = null;
  export let hydrated = false;

  const dispatch = createEventDispatcher<{
    select: string | null;
    edit: { id: string; name: string };
    delete: string;
  }>();

  let editingId: string | null = null;
  let editingName = '';
  let editInputs: Record<string, HTMLInputElement> = {};

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
      dispatch('edit', { id, name: editingName.trim() });
      editingId = null;
      editingName = '';
    }
  }

  function cancelEdit() {
    editingId = null;
    editingName = '';
  }

  function deleteTask(id: string) {
    dispatch('delete', id);
  }

  function toggleSelect(id: string) {
    dispatch('select', activeTaskId === id ? null : id);
  }
</script>

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
    {#each tasks as task}
      <li class="flex items-center gap-2 mb-2">
        {#if editingId === task.id}
          <input
            class="flex-1 border rounded px-2 py-1"
            bind:value={editingName}
            bind:this={editInputs[task.id]}
            on:keydown={(e) => e.key === 'Enter' && saveEdit(task.id)}
          />
          <button class="bg-green-500 text-white px-2 py-1 rounded" on:click={() => saveEdit(task.id)}>
            Save
          </button>
          <button class="bg-gray-400 text-white px-2 py-1 rounded" on:click={cancelEdit}>
            Cancel
          </button>
        {:else}
          <span class="flex-1">{task.name}</span>
          <button
            class={`px-2 py-1 rounded text-white ${activeTaskId === task.id ? 'bg-blue-600' : 'bg-blue-500'}`}
            on:click={() => toggleSelect(task.id)}
          >
            {activeTaskId === task.id ? 'Active' : 'Select'}
          </button>
          <button class="bg-yellow-500 text-white px-2 py-1 rounded" on:click={() => startEdit(task.id, task.name)}>
            Edit
          </button>
          <button class="bg-red-500 text-white px-2 py-1 rounded" on:click={() => deleteTask(task.id)}>
            Delete
          </button>
        {/if}
      </li>
    {/each}
  {/if}
</ul>
