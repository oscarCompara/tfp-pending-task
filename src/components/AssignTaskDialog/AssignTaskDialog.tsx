import * as React from 'react';
import { connect } from 'react-redux';
import { Actions, withTheme, Manager } from '@twilio/flex-ui';
import { namespace } from '../../state';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { WorkerListener } from '../../state/WorkerListener';
import { filterWorkerByDepartment } from '../../utils/FilterWorkerByDepartment';

interface AssignTaskDialogProps {
  isOpen: boolean;
  taskSid: string;
  workers: any[];
}

const manager = Manager.getInstance();
const DefaultValue = 'WORKER';

class AssignTaskDialog extends React.Component<AssignTaskDialogProps> {
  workerListener: any = undefined;

  constructor(props: AssignTaskDialogProps) {
    super(props);
    this.workerListener = WorkerListener.create() as any;
  }

  state = {
    //Selected worker short name
    selectedWorker: DefaultValue
  }

  componentDidMount() {
    this.workerListener.workersSearch()
  }

  componentWillUnmount() {
    this.workerListener.unsubscribe()
  }



  handleClose = () => {
    this.closeDialog();
  }

  closeDialog = () => {
    Actions.invokeAction('SetComponentState', {
      name: 'AssignTaskDialog',
      state: { isOpen: false }
    });
  }


  handleChange = (e: React.ChangeEvent) => {
    const value = (e as React.ChangeEvent<HTMLSelectElement>)?.target?.value;
    console.log('Selected Worker: ', value);
    this.setState({ selectedWorker: value });
  }

  handleAssignTask = async () => {
    const workerSid = this.state.selectedWorker;
    const taskSid = this.props?.taskSid
    //Only update if worker selected
    if (workerSid && workerSid !== DefaultValue) {
      console.log('UPDATING TASK:', taskSid);

      const fetchUrl = `${process.env.REACT_APP_SERVICE_BASE_URL}`;

      const fetchBody = {
        Token: manager.store.getState().flex.session.ssoTokenPayload.token,
        taskSid,
        workerSid
      };
      const fetchOptions = {
        method: 'POST',
        body: new URLSearchParams(fetchBody),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      };

      try {
        const response = await fetch(fetchUrl, fetchOptions);
        await response.json();
        console.debug('Task Updated');
      } catch (error) {
        console.error('Task Update Failed', error);
      }
      //clear state
      this.setState({ selectedWorker: DefaultValue });
      this.closeDialog();
    }

  }
  
  render() {

 const workers = manager.user.roles.includes('admin') ? this.props?.workers as any: filterWorkerByDepartment(this.props.workers);
 
    return (
      <Dialog
        open={this.props?.isOpen as any|| false}
        onClose={this.handleClose}
      >
        <DialogContent>
        <DialogContentText>
            Task: {this.props.taskSid}
          </DialogContentText>
          <DialogContentText>
            Available Workers:
          </DialogContentText>
          <Select
            value={this.state.selectedWorker}
            onChange={this.handleChange}
            name="worker"
          >
            <MenuItem value={DefaultValue}>SELECT WORKER</MenuItem>
            {workers.map((worker: any) => (
              <MenuItem
                key={worker.worker_sid}
                value={worker.worker_sid}
              > {worker.friendly_name} [Skills: {worker.attributes?.routing?.skills ? worker.attributes.routing.skills.toString() : "None"}]
              </MenuItem>
            ))}

          </Select>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={this.handleAssignTask}
            color="primary"
          >
            Assign Task
          </Button>

        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state:any) => {
  const componentViewStates = state.flex.view.componentViewStates;
  const assignTaskDialogState = componentViewStates && componentViewStates.AssignTaskDialog;
  const isOpen = assignTaskDialogState && assignTaskDialogState.isOpen;
  return {
    isOpen,
    taskSid: state?.[namespace].queueSummary.selectedTaskSid,
    workers: state?.[namespace].workerList.workers || []
  } as AssignTaskDialogProps;
};










export default connect(mapStateToProps)(withTheme(AssignTaskDialog) as React.ComponentType<AssignTaskDialogProps>);
