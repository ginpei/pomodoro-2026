import { createTaskStore, type TaskState } from './tasks';
import { beforeEach, describe, expect, it } from 'vitest';

function createMemoryStorage() {
  let tasks: TaskState['tasks'] = [];
  let selectedTaskId: string | null = null;
  return {
    loadTasks() {
      return tasks;
    },
    loadSelectedTaskId() {
      return selectedTaskId;
    },
    saveTasks(next: TaskState['tasks']) {
      tasks = next;
    },
    saveSelectedTaskId(next: string | null) {
      selectedTaskId = next;
    }
  };
}

function createIdGenerator(ids: string[]) {
  let index = 0;
  return () => ids[index++] ?? `task-${index}`;
}

function getState(store: ReturnType<typeof createTaskStore>) {
  let state: TaskState | undefined;
  const unsub = store.subscribe(value => (state = value));
  unsub();
  return state!;
}

describe('task store', () => {
  let storage: ReturnType<typeof createMemoryStorage>;
  let store: ReturnType<typeof createTaskStore>;

  beforeEach(() => {
    storage = createMemoryStorage();
    store = createTaskStore({
      storage,
      generateId: createIdGenerator(['task-1', 'task-2'])
    });
  });

  it('adds and edits tasks', () => {
    store.addTask('First');
    store.addTask('Second');
    let state = getState(store);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0]).toEqual({ id: 'task-1', name: 'First' });
    store.editTask('task-1', 'Updated');
    state = getState(store);
    expect(state.tasks[0].name).toBe('Updated');
  });

  it('clears selection when deleting selected task', () => {
    store.addTask('First');
    store.selectTask('task-1');
    store.deleteTask('task-1');
    const state = getState(store);
    expect(state.selectedTaskId).toBe(null);
  });
});
