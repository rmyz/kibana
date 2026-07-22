/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useInvestigationState } from '@kbn/investigation-output';
import type {
  SignificantEvent,
  SignificantEventInvestigation,
} from '@kbn/significant-events-schema';
import { useKibana } from '../../../utils/kibana_react';
import { InvestigationFlyout } from './investigation_flyout';
import { InvestigationSummaryCard } from './investigation_summary_card';

export interface EventInvestigationProps {
  event: SignificantEvent;
}

const isInvestigationRunning = (investigation: SignificantEventInvestigation): boolean =>
  investigation.completed_at == null;

export function EventInvestigation({ event }: EventInvestigationProps): React.ReactElement {
  const { http } = useKibana().services;
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const investigation = useMemo(() => (event.investigations ?? []).at(-1), [event.investigations]);

  const { state, error, status, conversationId } = useInvestigationState({
    http,
    workflowExecutionId: investigation?.workflow_execution_id,
    isRunning: investigation ? isInvestigationRunning(investigation) : false,
  });

  const openFlyout = () => {
    setIsFlyoutOpen(true);
  };

  return (
    <>
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('xpack.observability.nightshift.flyout.investigationTitle', {
                defaultMessage: 'Investigation',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        {investigation && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              color="primary"
              data-test-subj="nightshiftInvestigationShowDetailsButton"
              onClick={() => openFlyout()}
            >
              {i18n.translate('xpack.observability.nightshift.flyout.investigationShowDetails', {
                defaultMessage: 'Show details',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      {!investigation ? (
        <EuiText size="s" color="subdued" data-test-subj="nightshiftInvestigationEmptyState">
          <p>
            {i18n.translate(
              'xpack.observability.nightshift.flyout.investigationsEmptyDescription',
              {
                defaultMessage: 'No investigations yet.',
              }
            )}
          </p>
        </EuiText>
      ) : (
        <InvestigationSummaryCard
          eventTitle={event.title}
          status={status}
          state={state}
          error={error}
          startedAt={investigation.started_at}
          completedAt={investigation.completed_at}
          onShowMoreRecommendations={openFlyout}
        />
      )}

      {isFlyoutOpen && investigation && (
        <InvestigationFlyout
          eventTitle={event.title}
          investigation={investigation}
          status={status}
          state={state}
          error={error}
          conversationId={conversationId}
          onClose={() => setIsFlyoutOpen(false)}
        />
      )}
    </>
  );
}
