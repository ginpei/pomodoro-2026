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
    reorder: { id: string; toIndex: number };
  }>();

  let editingId: string | null = null;
  let editingName = '';
  let editInputs: Record<string, HTMLInputElement> = {};
  let draggingId: string | null = null;
  let dragOverId: string | null = null;
  let draggingIndex = -1;
  let dragOverIndex = -1;
  let isMovingDown = false;

  $: draggingIndex = draggingId ? tasks.findIndex(task => task.id === draggingId) : -1;
  $: dragOverIndex = dragOverId ? tasks.findIndex(task => task.id === dragOverId) : -1;
  $: isMovingDown = draggingIndex >= 0 && dragOverIndex >= 0 && draggingIndex < dragOverIndex;

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

  function startDrag(event: PointerEvent, id: string) {
    if (editingId) {
      return;
    }
    draggingId = id;
    dragOverId = id;
    const handle = event.currentTarget as HTMLElement | null;
    handle?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateDragTarget(event: PointerEvent) {
    if (!draggingId) {
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const item = target?.closest?.('li[data-task-id]') as HTMLElement | null;
    const taskId = item?.dataset?.taskId;
    if (taskId) {
      dragOverId = taskId;
    }
    event.preventDefault();
  }

  function finishDrag() {
    if (!draggingId) {
      return;
    }
    const fromId = draggingId;
    const toId = dragOverId;
    draggingId = null;
    dragOverId = null;
    if (!toId || fromId === toId) {
      return;
    }
    const toIndex = tasks.findIndex(task => task.id === toId);
    if (toIndex < 0) {
      return;
    }
    dispatch('reorder', { id: fromId, toIndex });
  }
</script>

<ul class:select-none={draggingId != null}>
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
      {#if draggingId != null && dragOverId === task.id && draggingId !== task.id && !isMovingDown}
        <li class="mb-2">
          <div class="h-0.5 bg-blue-500 rounded"></div>
        </li>
      {/if}
      <li
        class="flex items-center gap-2 mb-2"
        class:opacity-60={draggingId === task.id}
        data-task-id={task.id}
      >
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
          <button
            class={`px-2 py-1 rounded text-gray-600 touch-none ${draggingId === task.id ? 'cursor-grabbing' : 'cursor-grab'}`}
            type="button"
            aria-label="Reorder task"
            disabled={editingId != null}
            on:pointerdown={(event) => startDrag(event, task.id)}
            on:pointermove={updateDragTarget}
            on:pointerup={finishDrag}
            on:pointercancel={finishDrag}
          >
            ::
          </button>
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
      {#if draggingId != null && dragOverId === task.id && draggingId !== task.id && isMovingDown}
        <li class="mb-2">
          <div class="h-0.5 bg-blue-500 rounded"></div>
        </li>
      {/if}
    {/each}
  {/if}
</ul>
