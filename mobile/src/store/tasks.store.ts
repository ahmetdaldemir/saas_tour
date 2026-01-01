import { create } from 'zustand';
import { opsService, OpsTask, OpsTaskType, OpsTaskStatus } from '../services/ops.service';

interface TasksState {
  tasks: OpsTask[];
  isLoading: boolean;
  error: string | null;
  selectedTask: OpsTask | null;
  fetchTasks: (filters?: {
    type?: OpsTaskType;
    status?: OpsTaskStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  setSelectedTask: (task: OpsTask | null) => void;
  refresh: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  selectedTask: null,

  fetchTasks: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await opsService.getTasks(filters);
      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  fetchTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const task = await opsService.getTask(id);
      set({ selectedTask: task, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch task', isLoading: false });
    }
  },

  setSelectedTask: (task: OpsTask | null) => {
    set({ selectedTask: task });
  },

  refresh: async () => {
    const state = get();
    await state.fetchTasks();
  },
}));

