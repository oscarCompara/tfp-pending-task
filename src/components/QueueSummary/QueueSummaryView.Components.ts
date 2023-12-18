import styled from '@emotion/styled'
import { Button } from "@material-ui/core";

export const QueueSummaryTableContainer = styled('div')`
  border-style: solid;
  border-width: 0 0 1px 0;
  /* min-height: 68px; */
  overflow-y: auto;
  width: 100%;
  font-weight: bold;
  color: white;
`;




export const TasksTableContainer = styled('div')`
  border-style: solid;
  border-width: 1px 1px 1px 1px;
  /* min-height: 68px; */
  overflow-y: auto;
  font-weight: bold;
  margin-left: 50px;

`;


export const StyledButton = styled(Button)`
  font-size: 10px;
  font-weight: bold;
`;

