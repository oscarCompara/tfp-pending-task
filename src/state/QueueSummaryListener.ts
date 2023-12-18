import { Manager } from "@twilio/flex-ui";
import { Actions } from './QueueSummaryState';
import { ItemsSnapshot } from "twilio-sync/lib/livequery";


/**
 * LiveQuery implementation.
 * Preference is to use this instead of QueueSummaryService - which uses InstantQuery
 * LiveQuery subscribes to the search and receives updates - without requiring polling requests
 * This is much safer for mitigating against rate-limiting, and also brings real-time update benefits! 
 */
export class QueueSummaryListener {

  private queuesLiveQuery: any = undefined;
  private tasksLiveQueries: Map<string, any> = new Map(); // Map queue_sid to filtered task LiveQuery

  static create() {
    return new QueueSummaryListener();
  }

  constructor() {
  }


  unsubscribe() {
    this.unsubscribeQueuesLiveQuery();
    this.unsubscribeTasksLiveQueries();
  }

  private unsubscribeQueuesLiveQuery() {
    if (this.queuesLiveQuery) {
        this.queuesLiveQuery.removeAllListeners();
        this.queuesLiveQuery.close();
        this.queuesLiveQuery = undefined;
    }
  }  

  private unsubscribeTasksLiveQueries() {
    if (this.tasksLiveQueries && this.tasksLiveQueries.size > 0) {
      this.tasksLiveQueries.forEach((tasksLiveQuery) => {
        this.unsubscribeTaskLiveQuery(tasksLiveQuery);
      });
      this.tasksLiveQueries = new Map();
    }
  }  

  private unsubscribeTaskLiveQuery(tasksLiveQuery: { removeAllListeners: () => void; close: () => void; } | undefined) {
    if (tasksLiveQuery) {
        tasksLiveQuery.removeAllListeners();
        tasksLiveQuery.close();
        tasksLiveQuery = undefined;
    }
  }  

  queuesSearch(selectedQueues: any) {
    // See Flex-Monorepo SupervisorWorkerListener for inspiration
    this.subscribeQueuesLiveQuery(selectedQueues);
  }

  private subscribeQueuesLiveQuery(selectedQueues: any) {
    Manager
      .getInstance()
      .insightsClient
      .liveQuery("tr-queue", QueueSummaryListener.constructQueueQuery(selectedQueues))
      .then((q) => {

        this.queuesLiveQuery = q;
        this.updateStateQueues(q.getItems());

        q.on('itemRemoved', (item) => {
          this.onQueueItemRemoved(item);
        });
        q.on('itemUpdated', (item) => {
          this.onQueueItemUpdated(item);
        });
      })
      .catch(function (e) {
        console.error('Error when subscribing to live updates on queue search', e);
      });
  }

  private onQueueItemUpdated(queueItem: any) {
    // Don't really care yet about queues changing in real-time, so just log it
    console.warn(`Queue item was updated, and we have no logic to handle it: ${JSON.stringify(queueItem)}`);
    // TODO: Add logic to deal with this
  }

  private onQueueItemRemoved(queueItem: any) {
    // Don't really care yet about queues changing in real-time, so just log it
    console.warn(`Queue item removed, and we have no logic to handle it: ${JSON.stringify(queueItem)}`);
    // TODO: Add logic to deal with this
  }
  
  
  
  private updateStateQueues(insightsQueues: ItemsSnapshot) {
    const queueResults = Object.keys(insightsQueues).map(queueSid => {
      const queueResult = insightsQueues[queueSid];
      // Go get the tasks
      this.tasksSearch(queueResult);
      return queueResult;
    });
    Manager.getInstance().store.dispatch(Actions.setQueues(queueResults));
  
    console.debug(`${queueResults.length} tr-queue results`);
  };
  
  
  
  private static constructQueueQuery(selectedQueues: any) {

    if (selectedQueues) {
      return `data.queue_name IN ${JSON.stringify(selectedQueues)}`
    } else {
      return ''; // Get all queues for now
    }
  };
  
  
  private tasksSearch(queue: any) {
    this.subscribeTasksLiveQuery(queue);
  };
  

  private subscribeTasksLiveQuery(queue: { sid: string; queue_name: any; queue_sid: any; }) {
    Manager
      .getInstance()
      .insightsClient
      .liveQuery("tr-task", QueueSummaryListener.constructTaskQuery(queue))
      .then((q) => {

        this.tasksLiveQueries.set(queue.sid, q);
        this.updateStateTasksForQueue(queue, q.getItems());

        q.on('itemRemoved', (item) => {
          console.debug(`Queue task item removed: SID: ${item.key} | Queue: ${queue.queue_name}`);
          this.onQueueTaskItemRemoved(queue.queue_sid, item);
        });
        q.on('itemUpdated', (item) => {
          console.debug(`Queue task item updated: SID: ${JSON.stringify(item.value.task_sid)} | Queue: ${queue.queue_name}`);
          this.onQueueTaskItemUpdated(item);
        });
      })
      .catch(function (e) {
        console.error('Error when subscribing to live updates on task search', e);
      });
  }

  private onQueueTaskItemUpdated(taskItem: { value: any; }) {
    const task = taskItem.value;
    // We need to find the queue this task resides in, then update/add the task within our state
    Manager.getInstance().store.dispatch(Actions.handleTaskUpdated(task));

  }

  private onQueueTaskItemRemoved(queueSid: any, taskItem: { key: any; }) {
    // We need to find the queue this task resides in, then remove the task from our state
    Manager.getInstance().store.dispatch(Actions.handleTaskRemoved(queueSid, taskItem.key));
  }

  private updateStateTasksForQueue(queue: { queue_name: any; queue_sid: any; }, insightsTasks: ItemsSnapshot) {
    const tasks = Object.keys(insightsTasks)
      .map(taskSid => insightsTasks[taskSid])
      .sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
    // Must use proper action and reducer to update Redux store
    console.debug(`${tasks.length} tr-task results for queue: ${queue.queue_name}`);
    Manager.getInstance().store.dispatch(Actions.setQueueTasks(queue.queue_sid, tasks));
    //tasks.length > 0 && console.debug(JSON.stringify(tasks));
    
  };
  
  private static constructTaskQuery(queue: { queue_name: any; }) {
    return `data.queue_name == "${queue.queue_name}" AND data.status IN ["pending", "reserved"]`;
  };
}
