import React from "react";

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import QueueSummaryRow from "./QueueSummaryRow";
import * as Constants from '../../utils/Constants';

interface QueueSummaryTableProps {
  queues: any[];
  config: any;
}

const QueueSummaryTable: React.FC<QueueSummaryTableProps> = (props) => (
  <Table aria-label="simple table" style={{color: 'white'}}>
    <TableHead>
      <TableRow>
        <TableCell />
        <TableCell>Queue</TableCell>
        <TableCell>Tasks</TableCell>
        {props.config[Constants.CONFIG_QUEUE_TASK_COLUMNS] && Object.values(props.config[Constants.CONFIG_QUEUE_TASK_COLUMNS]).map((column: any) => (
          <TableCell key={column}>{column}</TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {props.queues && props.queues.length > 0 ?
        Object.values(props.queues).sort(compareQueues).map((queue: any) => (
          <QueueSummaryRow key={queue.queue_sid} queue={queue} config={props.config} />
        )) :
        <TableRow key='no-queues'>
          <TableCell colSpan={2+props.config[Constants.CONFIG_QUEUE_TASK_COLUMNS].length}>No queues</TableCell>
        </TableRow>
      }
    </TableBody>
  </Table>
);

const compareQueues = (a: any, b: any) => {
  if (a.queue_name < b.queue_name) {
    return -1;
  } else if (a.queue_name > b.queue_name) {
    return 1;
  } else {
    return 0;
  }
}

export default QueueSummaryTable;
