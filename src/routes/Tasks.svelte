<script lang="ts">
  import { taskStore, type Task } from '$lib/tasks';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import TaskInput from './TaskInput.svelte';
  import TaskList from './TaskList.svelte';

  const initial = get(taskStore);
  let taskList: Task[] = initial.tasks;

  let hydrated = false;
  const unsubTasks = taskStore.subscribe(v => {
    taskList = v.tasks;

  });

  onMount(() => {
    hydrated = true;
  });

  onDestroy(() => {
    unsubTasks();
  });

  function handleAdd(event: CustomEvent<string>) {
    taskStore.addTask(event.detail);
  }

  function handleEdit(event: CustomEvent<{ id: string; name: string }>) {
    taskStore.editTask(event.detail.id, event.detail.name);
  }

  function handleDelete(event: CustomEvent<string>) {
    taskStore.deleteTask(event.detail);
  }



  function handleMove(event: CustomEvent<{ id: string; toId: string | null; newState: string; after?: boolean }>) {
    // Move task to new state and reorder within group
    const { id, toId, newState, after } = event.detail;
    taskStore.setTaskState(id, newState);
    const tasks = get(taskStore).tasks;
    const groupTasks = tasks.filter(t => t.state === newState);
    let toIndex = 0;
    if (toId) {
      toIndex = groupTasks.findIndex(t => t.id === toId);
      if (toIndex >= 0) {
        let targetIndex = tasks.findIndex(t => t.id === toId);
        if (after) {
          targetIndex += 1;
        }
        taskStore.reorderTask(id, targetIndex);
      }
    } else {
      // Dropped on group title: move to start of group
      if (groupTasks.length > 0) {
        taskStore.reorderTask(id, tasks.findIndex(t => t.id === groupTasks[0].id));
      }
    }
  }
</script>

<div class="mt-6 w-full max-w-xs mx-auto">
  <h2 class="text-lg font-bold mb-2">Tasks</h2>
  <TaskInput on:add={handleAdd} disabled={!hydrated} />
  <TaskList
    tasks={taskList}

    hydrated={hydrated}
    on:edit={handleEdit}
    on:delete={handleDelete}

    on:move={handleMove}
  />
</div>
