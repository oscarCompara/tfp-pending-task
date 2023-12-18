import { Manager } from "@twilio/flex-ui";

export const filterWorkerByDepartment = (workers: any[]) => {
    const manager = Manager.getInstance();
    const { attributes } = manager.workerClient as any;

    return workers.filter(worker => worker.attributes.department === attributes.department);
}
