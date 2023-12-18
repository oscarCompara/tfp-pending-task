import React, { Component } from "react";
import { connect } from 'react-redux';

import { withTheme } from "@twilio/flex-ui";
import { namespace } from '../../state';

import QueueSummaryTable from "./QueueSummaryTable";
import { QueueSummaryTableContainer } from './QueueSummaryView.Components';
import { QueueSummaryService } from '../../state/QueueSummaryService';
import { QueueSummaryListener } from '../../state/QueueSummaryListener';
import { CONFIG, DEFAULT_POLL_FREQUENCY_IN_MILLIS } from "../../utils/Constants";

interface QueueSummaryViewProps {
  selectedQueues: string[];
  queueSummary: {
    queues: any[];
    config: any;
  };
}

class QueueSummaryView extends Component<QueueSummaryViewProps> {
  queueSummaryListener: any;
  refreshTimer: any;

  constructor(props: QueueSummaryViewProps) {
    super(props);
    if (CONFIG.useLiveQuery) {
      this.queueSummaryListener = QueueSummaryListener.create();
    }
  }

  componentDidMount() {
    if (!CONFIG.useLiveQuery) {
      QueueSummaryService.init(this.props.selectedQueues);
      this.refreshTimer = window.setInterval(() => {
        QueueSummaryService.refresh(this.props.selectedQueues);
      }, CONFIG.pollFrequencyInMillis ? CONFIG.pollFrequencyInMillis : DEFAULT_POLL_FREQUENCY_IN_MILLIS);
    } else {
      this.queueSummaryListener.queuesSearch(this.props.selectedQueues);
    }
  }

  componentWillUnmount() {
    if (!CONFIG.useLiveQuery) {
      if (this.refreshTimer !== undefined) {
        window.clearInterval(this.refreshTimer);
      }
      QueueSummaryService.close();
    } else {
      this.queueSummaryListener.unsubscribe();
    }
  }

  render() {
    return (
      <QueueSummaryTableContainer style={{ backgroundColor: 'white' }}>
        <QueueSummaryTable queues={this.props.queueSummary.queues} config={this.props.queueSummary.config} />
      </QueueSummaryTableContainer>
    );
  }
}

const mapStateToProps = (state: any) => {
  const customReduxStore = state?.[namespace];
  let selectedQueues = state['flex'].worker.attributes['queues_view_filters'];

  return {
    queueSummary: customReduxStore.queueSummary,
    selectedQueues
  }
}

export default connect(mapStateToProps)(withTheme(QueueSummaryView));
