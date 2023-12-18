import { Manager } from "@twilio/flex-ui";
import { Actions } from './WorkerListState';
import LiveQuery, { ItemsSnapshot } from "twilio-sync/lib/livequery";

/**
 * LiveQuery implementation.
 * LiveQuery subscribes to the search and receives updates
 */
export class WorkerListener {
  WorkersLiveQuery = undefined;
  
  static create() {
    return new WorkerListener();
  }

  constructor() {
  }


  unsubscribe() {
    this.unsubscribeWorkersLiveQuery();
  }

  unsubscribeWorkersLiveQuery() {
    if (this.WorkersLiveQuery) {
        (this.WorkersLiveQuery as LiveQuery).removeAllListeners(); // Add type assertion
        (this.WorkersLiveQuery as LiveQuery).close(); // Add type assertion
        this.WorkersLiveQuery = undefined;
    }
  }  

  workersSearch() {
    this.subscribeWorkersLiveQuery();
  }

  subscribeWorkersLiveQuery() {
    Manager
      .getInstance()
      .insightsClient
      .liveQuery("tr-worker", WorkerListener.constructWorkerQuery())
      .then((q) => {

        this.WorkersLiveQuery = q as any; // Update the type declaration of WorkersLiveQuery

        this.updateStateWorkers(q.getItems());

        q.on('itemRemoved', (item) => {
          this.onWorkerItemRemoved(item);
        });
        q.on('itemUpdated', (item) => {
          this.onWorkerItemUpdated(item);
        });
      })
      .catch(function (e) {
        console.log('Error when subscribing to live updates on worker search', e);
      });
  }
  
  updateStateWorkers(insightsWorkers: ItemsSnapshot) {
    const workerList: Worker[] = Object.keys(insightsWorkers).map(workerSid => {
      const workerResult: Worker = insightsWorkers[workerSid] as Worker; // Explicitly type workerResult as Worker
      return workerResult;
    });
    Manager.getInstance().store.dispatch(Actions.setWorkers(workerList as any));
    console.debug(`${workerList.length} tr-worker results`);
  };
  
  static constructWorkerQuery() {
    //Only get available workers
    return `data.activity_name == "Available"`;
  };


  onWorkerItemUpdated(workerItem: { value: any; key: any; }) {
    // insights query item contains { key: <sid>, value: <worker obj>}
    const worker = workerItem.value;
    console.log(`Worker updated: ${workerItem.key}`);
    //Update worker in our state
    Manager.getInstance().store.dispatch(Actions.handleWorkerUpdated(worker));
  }

  onWorkerItemRemoved(workerItem: { key: any; }) {
    console.log(`Worker removed: ${workerItem.key}`);
    //Remove worker from our state
    Manager.getInstance().store.dispatch(Actions.handleWorkerRemoved(workerItem.key));
  }
  
}
