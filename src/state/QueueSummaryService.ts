import { Manager } from "@twilio/flex-ui";
import { Actions } from './QueueSummaryState';

/**
 * InstantQuery implementation (requires polling).
 * Preference is to use QueueSummaryListener - which uses LiveQuery
 */
export class QueueSummaryService {

  static isInitialized = false;

  static init(selectedQueues: string[]) {

    if (this.isInitialized) {
      return;
    }

    QueueSummaryService.queuesSearch(selectedQueues);

    this.isInitialized = true;
  }

  static refresh(selectedQueues: string[]) {
    if (!QueueSummaryService.isInitialized) {
      QueueSummaryService.queuesSearch(selectedQueues);
    }
  }

  static close() {
    QueueSummaryService.isInitialized = false;
  }

  static queuesSearch(selectedQueues: string[]) {
    Manager.getInstance()
      .insightsClient.instantQuery("tr-queue")
      .then((q) => {
        q.on("searchResult", this.setQueueList);
        q.search(QueueSummaryService.constructQueueQuery(selectedQueues));
      });
  };

  static setQueueList(insightsQueues: any) {
    const queueResults = Object.keys(insightsQueues).map(queueSid => {
      const queueResult = insightsQueues[queueSid];
      // Go get the tasks
      QueueSummaryService.tasksSearch(queueResult);
      return queueResult;
    });
    Manager.getInstance().store.dispatch(Actions.setQueues(queueResults));

    console.debug(`${queueResults.length} tr-queue results`);
  };

  static constructQueueQuery(selectedQueues: string[]) {
    if (selectedQueues) {
      return `data.queue_name IN ${JSON.stringify(selectedQueues)}`
    } else {
      return ''; // Get all queues for now
    }
  };
  
  
  static tasksSearch(queue:  any) {
    Manager.getInstance()
      .insightsClient.instantQuery("tr-task")
      .then((q) => {
        q.on("searchResult", (result) => this.setTaskList(queue, result));
        q.search(QueueSummaryService.constructTaskQuery(queue));
      });
  };
  
  
  static setTaskList(queue: { queue_name: any; queue_sid: any; }, insightsTasks: { [x: string]: any; }) {
    const tasks = Object.keys(insightsTasks)
      .map(taskSid => insightsTasks[taskSid])
      .sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
    // Must use proper action and reducer to update Redux store
    console.debug(`${tasks.length} tr-task results for queue: ${queue.queue_name}`);
    Manager.getInstance().store.dispatch(Actions.setQueueTasks(queue.queue_sid, tasks));
    //tasks.length > 0 && console.debug(JSON.stringify(tasks));
    
  };
  
  static constructTaskQuery(queue: { queue_name: any; }) {
    return `data.queue_name == "${queue.queue_name}"`;// AND data.status == "pending"`;
  };
}
