import * as Constants from '../utils/Constants';

const ACTION_SET_FILTERS = "SET_FILTERS"; // Not used
const ACTION_SET_QUEUES = "SET_QUEUES";
const ACTION_SET_QUEUE_TASKS = "SET_QUEUE_TASKS";
const ACTION_HANDLE_TASK_UPDATED = "HANDLE_TASK_UPDATED";
const ACTION_HANDLE_TASK_REMOVED = "HANDLE_TASK_REMOVED";
const ACTION_SET_SELECTED_QUEUE = "SET_SELECTED_QUEUE"; // Not used
const ACTION_RECALCULATE_FILTERS = "RECALCULATE_FILTERS"; // Not used

const ACTION_SET_SELECTED_TASK = 'SET_SELECTED_TASK';
const ACTION_REMOVE_SELECTED_TASK = 'REMOVE_SELECTED_TASK';


interface QueueSummaryState {
  filters: any[];
  queues?: any;
  selectedQueueSid?: string;
  selectedTaskSid?: string;
  config: any;
}

// Define plugin actions
export class Actions {
  static setFilters = (filters: any[]) => ({
    type: ACTION_SET_FILTERS,
    filters
  });
  static setQueues = (queues: any) => ({
    type: ACTION_SET_QUEUES,
    queues
  });
  static setQueueTasks = (queueSid: string, tasks: any) => ({
    type: ACTION_SET_QUEUE_TASKS,
    payload: {
      queueSid,
      tasks
    }
  });
  static handleTaskUpdated = (task: any) => ({
    type: ACTION_HANDLE_TASK_UPDATED,
    task
  });
  static handleTaskRemoved = (queueSid: string, taskSid: string) => ({
    type: ACTION_HANDLE_TASK_REMOVED,
    payload: {
      queueSid,
      taskSid
    }
  });
  static setSelectedQueue = (selectedQueueSid: string) => ({
    type: ACTION_SET_SELECTED_QUEUE,
    selectedQueueSid
  });
  static setSelectedTask = (selectedTaskSid: string) => ({
    type: ACTION_SET_SELECTED_TASK,
    selectedTaskSid
  });
  static removeSelectedTask = () => ({
    type: ACTION_REMOVE_SELECTED_TASK
  });

  static recalculateFilters = () => ({
    type: ACTION_RECALCULATE_FILTERS
  });
}

// Define how actions influence state
export function reduce(state: QueueSummaryState = initialState, action: any) {
  switch (action.type) {
    case ACTION_SET_FILTERS:
      return {
        ...state,
        filters: action.filters,
      };
    case ACTION_SET_QUEUES:
      return {
        ...state,
        queues: action.queues,
      };
    case ACTION_SET_QUEUE_TASKS:
      return {
        ...state,
        queues: state.queues.map((item: any, index: number) => {
          // Update the matching queue
          if (item.queue_sid === action.payload.queueSid) {
            return {
              ...item,
              tasks: action.payload.tasks,
              columnStats: getTaskStatsForColumns(action.payload.tasks, state.config)
            }
          }
          // Non matching queues left untouched
          return item;
        }),
      };
    case ACTION_HANDLE_TASK_UPDATED:
      return {
        ...state,
        queues: state.queues.map((queue: any) => {
          if (queue.queue_name === action.task.queue_name) {
            const copyOfTasks = [...queue.tasks];
            const existingTaskIndex = copyOfTasks.findIndex((t: any) => t.task_sid === action.task.task_sid);
            if (existingTaskIndex < 0) {
              copyOfTasks.push(action.task);
            } else {
              copyOfTasks[existingTaskIndex] = action.task;
            }
            return {
              ...queue,
              tasks: copyOfTasks,
              columnStats: getTaskStatsForColumns(copyOfTasks, state.config)
            }
          }
          return queue;
        }),
      };
    case ACTION_HANDLE_TASK_REMOVED:
      return {
        ...state,
        queues: state.queues.map((queue: any) => {
          if (queue.queue_sid === action.payload.queueSid) {
            const copyOfTasks = [...queue.tasks];
            const existingTaskIndex = copyOfTasks.findIndex((t: any) => t.task_sid === action.payload.taskSid);
            if (existingTaskIndex > -1) {
              copyOfTasks.splice(existingTaskIndex);
            } 
            return {
              ...queue,
              tasks: copyOfTasks,
              columnStats: getTaskStatsForColumns(copyOfTasks, state.config)
            }
          }
          return queue;
        }),
      };
    case ACTION_SET_SELECTED_QUEUE:
      return {
        ...state,
        selectedQueueSid: action.selectedQueueSid,
      };
    case ACTION_SET_SELECTED_TASK:
      return {
        ...state,
        selectedTaskSid: action.selectedTaskSid,
      };
    case ACTION_REMOVE_SELECTED_TASK:
      return {
        ...state,
        selectedTaskSid: undefined,
      };
    case ACTION_RECALCULATE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters
        }
      };
    default:
      return state;
  }

  function getTaskStatsForColumns(tasks: any[], config: any) {

    const columns = config[Constants.CONFIG_QUEUE_TASK_COLUMNS];

    // Go through columns array, and for each column (task attribute), build up a map of 
    // unique values and their respective stats (e.g. count, max age) - for display
    const columnStats = columns.map((taskAttribute: string) => {

      let columnStatsMap = new Map();
      // Start with tasks that actually have this attribute.
      // List is already sorted by age, so we know item 1 in any filtered list is the max age :)
      // tsconfig.json
   
      const columnStatsMapDesc = new Map([...columnStatsMap.entries() as any].sort((a, b) => b.taskCount - a.tasksCount)) as any;

      return columnStatsMapDesc;
    });
    return columnStats;
  }
};

const initialState: QueueSummaryState = {
  filters: [],
  queues: undefined,
  selectedQueueSid: undefined,
  selectedTaskSid: undefined,
  config: Constants.CONFIG
};
