import React, { Component } from 'react';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

import { StyledButton, TasksTableContainer } from './QueueSummaryView.Components';
import { Ticker } from "../Ticker";

import { Actions } from '@twilio/flex-ui';

import { Actions as QueueSummaryActions } from '../../state/QueueSummaryState';

import { Manager } from '@twilio/flex-ui';
const manager = Manager.getInstance();

import * as Constants from '../../utils/Constants';
import { getDurationTask } from '../../utils/Date';

const styles = {
  expanded: {
    '& > *': {
      borderBottom: 'unset',
    }
  }
};

interface QueueSummaryRowProps extends WithStyles<typeof styles> {
  queue: any;
  config: any;
}

interface QueueSummaryRowState {
  open: boolean;
}

class QueueSummaryRow extends Component<QueueSummaryRowProps, QueueSummaryRowState> {
  constructor(props: QueueSummaryRowProps) {
    super(props);
    this.state = {
      open: false
    };
  }

  onToggleOpen = (open: boolean) => {
    this.setState(() => ({ open }));
  };

  assignTaskToWorker = (taskSid: string) => {
    manager.store.dispatch(QueueSummaryActions.setSelectedTask(taskSid));
    console.debug('OPEN ASSIGN TASK DIALOG for task:', taskSid);
    Actions.invokeAction('SetComponentState', {
      name: 'AssignTaskDialog',
      state: { isOpen: true }
    });
  };

  componentDidUpdate() {
    console.debug(`Row updated for queue ${this.props.queue.queue_name}, Tasks: ${this.props.queue.tasks ? this.props.queue.tasks.length : 0}`);
  }

  render() {
    const { queue, config, classes } = this.props;
    return this.renderWithTicker(queue, config, classes);
  }

  renderWithTicker(queue: any, config: any, classes: any) {
    const ticker = (
      <Ticker>
        {() => {
          return (
            <React.Fragment>
              <TableRow key={queue.queue_sid} className={'' + (this.state.open ? classes.expanded : '')} >
                <TableCell>
                  <IconButton onClick={() => this.onToggleOpen(!this.state.open)}>
                    {this.state.open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  {queue.queue_name}
                </TableCell>
                <TableCell>{queue.tasks ? queue.tasks.length : 0}</TableCell>
                {this.renderQueueSummaryRowColumnData(queue, config[Constants.CONFIG_QUEUE_TASK_COLUMNS])}
              </TableRow>
              {this.state.open &&
                <TableRow key={queue.queue_sid + '_tasks'}>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={this.state.open} timeout="auto" unmountOnExit>
                      {this.renderTasksTable(queue.tasks, config[Constants.CONFIG_TASK_ATTRIBUTE_COLUMNS])}
                    </Collapse>
                  </TableCell>
                </TableRow>}
            </React.Fragment>
          );
        }}
      </Ticker>
    );
    return ticker;
  }

  renderQueueSummaryRowColumnData(queue: any, queueTaskColumns: any) {
    return (
      queueTaskColumns && Object.values(queueTaskColumns).map((column: any, index: number) => (
        <TableCell key={column}>
          {queue.columnStats && queue.columnStats[index].size > 0 ?
            [...queue.columnStats[index]].map(([key, stats]: any) => {
              console.log('stats', stats);
              return <div key={key}>{key}: {stats.taskCount} {getDurationTask(new Date(), new Date(stats.oldestDateCreated))}</div>;
            })
            : ''}
        </TableCell>
      ))
    );
  }

  renderTasksTable(tasks: any, taskAttributeColumns: any) {
    return (
      <TasksTableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task Age</TableCell>
              <TableCell>Task SID (Click to Pick)</TableCell>
              <TableCell>Type</TableCell>
              {taskAttributeColumns && Object.values(taskAttributeColumns).map((attribute: any) => (
                <TableCell key={attribute}>{attribute}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {
              (tasks && tasks.length > 0) ?
                tasks.map((task: any) =>
                  this.renderTasksTableRow(task, taskAttributeColumns)
                ) :
                <TableRow key='no-tasks'>
                  <TableCell colSpan={2 + taskAttributeColumns.length}>No tasks</TableCell>
                </TableRow>
            }
          </TableBody>
        </Table>
      </TasksTableContainer>
    );
  }

  renderTasksTableRow(task: any, taskAttributeColumns: any) {
    return (
      <TableRow key={task.task_sid} >
        <TableCell key={'duration task'}>
          {getDurationTask(new Date(), new Date(task.date_created))}
        </TableCell>
        <TableCell key={'task'}>
          <StyledButton
            onClick={() => {
              this.assignTaskToWorker(task.task_sid);
            }}
          > {task.task_sid.substring(0, 9)}... </StyledButton>
        </TableCell>
        <TableCell key={'channel'}>
          {task.channel_type}
        </TableCell>
        {taskAttributeColumns && Object.values(taskAttributeColumns).map((attribute: any) => (
          <TableCell key={attribute}>
            {task.attributes && task.attributes[attribute] ? task.attributes[attribute] : ''}
          </TableCell>
        ))}
      </TableRow>
    );
  }
}

export default withStyles(styles)(QueueSummaryRow);
