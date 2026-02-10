import { writable, type Writable } from 'svelte/store';
import {
  addTask as addTaskToState,
  deleteTask as deleteTaskFromState,
  editTask as editTaskInState,
  normalizeTaskState,
  reorderTasks as reorderTasksInState,
  selectTask as selectTaskInState,
  setTasks as setTasksInState,
  setTaskState as setTaskStateInState,
  type Task,
  type TaskState
} from './tasks-model';

export type { Task, TaskState, TaskStateName } from './tasks-model';

export interface TaskStorage {
  loadTasks(): Task[];
  loadSelectedTaskId(): string | null;
  saveTasks(tasks: Task[]): void;
  saveSelectedTaskId(taskId: string | null): void;
}

export interface TaskStoreOptions {
  storage?: TaskStorage;
  generateId?: () => string;
  initialState?: TaskState;
}

const TASKS_KEY = 'tasks';
const SELECTED_TASK_KEY = 'pomodoro-selected-task';

function createNoopTaskStorage(): TaskStorage {
  return {
    loadTasks() {
      return [];
    },
    loadSelectedTaskId() {
      return null;
    },
    saveTasks() {},
    saveSelectedTaskId() {}
  };
}

function createBrowserTaskStorage(): TaskStorage {
  if (typeof window === 'undefined') {
    return createNoopTaskStorage();
  }
  const storage = window.localStorage;
  return {
    loadTasks() {
      const raw = storage.getItem(TASKS_KEY);
      return raw ? (JSON.parse(raw) as Task[]) : [];
    },
    loadSelectedTaskId() {
      const raw = storage.getItem(SELECTED_TASK_KEY);
      return raw ? raw : null;
    },
    saveTasks(tasks) {
      storage.setItem(TASKS_KEY, JSON.stringify(tasks));
    },
    saveSelectedTaskId(taskId) {
      if (taskId) {
        storage.setItem(SELECTED_TASK_KEY, taskId);
      } else {
        storage.removeItem(SELECTED_TASK_KEY);
      }
    }
  };
}

export function createTaskStore(options: TaskStoreOptions = {}) {
  const storage = options.storage ?? createBrowserTaskStorage();
  const generateId =
    options.generateId ??
    (() => {
      const cryptoApi = globalThis.crypto;
      if (typeof cryptoApi?.randomUUID === 'function') {
        return cryptoApi.randomUUID();
      }
      throw new Error('crypto.randomUUID is not available');
    });

  const initial = options.initialState
    ? normalizeTaskState(options.initialState)
    : normalizeTaskState({
        tasks: storage.loadTasks(),
        selectedTaskId: storage.loadSelectedTaskId()
      });

  const { subscribe, update, set }: Writable<TaskState> = writable(initial);

  function persist(state: TaskState) {
    storage.saveTasks(state.tasks);
    storage.saveSelectedTaskId(state.selectedTaskId);
  }

  subscribe(persist);

  function addTask(name: string, taskState: TaskStateName = 'todo') {
    update(state => addTaskToState(state, name, generateId(), taskState));
  }

  function editTask(id: string, name: string) {
    update(state => editTaskInState(state, id, name));
  }

  function deleteTask(id: string) {
    update(state => deleteTaskFromState(state, id));
  }

  function selectTask(id: string | null) {
    update(state => selectTaskInState(state, id));
  }

  function setTasks(tasks: Task[]) {
    update(state => setTasksInState(state, tasks));
  }

  function setTaskState(id: string, newState: TaskStateName) {
    update(state => setTaskStateInState(state, id, newState));
  }

  function reorderTask(id: string, toIndex: number) {
    update(state => reorderTasksInState(state, id, toIndex));
  }

  function setState(state: TaskState) {
    set(normalizeTaskState(state));
  }

  return {
    subscribe,
    addTask,
    editTask,
    deleteTask,
    selectTask,
    setTasks,
    setTaskState,
    reorderTask,
    setState
  };
}

export const taskStore = createTaskStore();
