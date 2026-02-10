import { createTaskStore, type TaskState } from './tasks';
import { beforeEach, describe, expect, it } from 'vitest';

function createMemoryStorage() {
  let tasks: TaskState['tasks'] = [];
  return {
    loadTasks() {
      return tasks;
    },
    saveTasks(next: TaskState['tasks']) {
      tasks = next;
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
    store.addTask('First', 'todo');
    store.addTask('Second', 'in progress');
    let state = getState(store);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0]).toEqual({ id: 'task-1', name: 'First', state: 'todo' });
    expect(state.tasks[1]).toEqual({ id: 'task-2', name: 'Second', state: 'in progress' });
    store.editTask('task-1', 'Updated');
    state = getState(store);
    expect(state.tasks[0].name).toBe('Updated');
  });



  it('reorders tasks within group', () => {
    store.addTask('First', 'todo');
    store.addTask('Second', 'todo');
    store.addTask('Third', 'todo');
    store.reorderTask('task-3', 0);
    const state = getState(store);
    expect(state.tasks.map(task => task.id)).toEqual(['task-3', 'task-1', 'task-2']);
  });

  it('moves task between groups', () => {
    store.addTask('First', 'todo');
    store.addTask('Second', 'todo');
    store.setTaskState('task-2', 'complete');
    let state = getState(store);
    expect(state.tasks.find(t => t.id === 'task-2')?.state).toBe('complete');
  });

  it('moves task to empty group via title drop', () => {
    store.addTask('First', 'todo');
    store.setTaskState('task-1', 'in progress');
    let state = getState(store);
    expect(state.tasks[0].state).toBe('in progress');
    // Should be at start of in progress group
    expect(state.tasks[0].id).toBe('task-1');
  });
});
