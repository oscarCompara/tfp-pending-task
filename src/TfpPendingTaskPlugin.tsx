import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';


import reducers, { namespace } from "./state";
import { ContextUtil } from "./utils/ContextUtil";
import QueueSummaryView from "./components/QueueSummary";

import AssignTaskDialog from "./components/AssignTaskDialog/AssignTaskDialog";






const PLUGIN_NAME = 'TfpPendingTaskPlugin';

export default class TfpPendingTaskPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof Flex }
   */
  async init(flex: typeof Flex, manager: Flex.Manager): Promise<void> {
    this.registerReducers(manager);

    // If supervisor or admin role is found, good to go!
    if (ContextUtil.showSupervisor()) {
      flex.ViewCollection.Content.add(
        <flex.View name="QueueSummaryView" key="queueSummaryView">
          <QueueSummaryView />
        </flex.View>
      );

      flex.SideNav.Content.add(
        <flex.SideLink
          key="tasksSideLink"
          icon="GenericTask"
          iconActive="GenericTaskBold"
          onClick={() =>
            
            flex.Actions.invokeAction("NavigateToView", { viewName: "QueueSummaryView" })
          }
        >
          Pending Tasks
        </flex.SideLink>,
        { sortOrder: 2 }
      );

      flex.SideNav.Content.add(<AssignTaskDialog
        key="assign-task-modal"
      />, { sortOrder: 100 });
    }

  }
  registerReducers(manager:Flex.Manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${Flex.VERSION}`
      );
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
