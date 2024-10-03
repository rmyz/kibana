/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { rangeQuery } from '@kbn/observability-plugin/server';
import { ApmDocumentType } from '../../../../common/document_type';
import {
  AGENT_NAME,
  AGENT_VERSION,
  AT_TIMESTAMP,
  DATA_STEAM_TYPE,
  DATA_STREAM_DATASET,
  DATA_STREAM_NAMESPACE,
  EVENT_OUTCOME,
  EVENT_SUCCESS_COUNT,
  LABEL_GC,
  LABEL_LIFECYCLE_STATE,
  LABEL_NAME,
  LABEL_TELEMETRY_AUTO_VERSION,
  LABEL_TYPE,
  OBSERVER_HOSTNAME,
  OBSERVER_TYPE,
  OBSERVER_VERSION,
  OBSERVER_VERSION_MAJOR,
  PROCESSOR_EVENT,
  PROCESSOR_NAME,
  SERVICE_FRAMEWORK_NAME,
  SERVICE_NAME,
  SERVICE_NODE_NAME,
  SPAN_ID,
  TIMESTAMP,
  TRACE_ID,
  TRANSACTION_DURATION,
  TRANSACTION_ID,
  TRANSACTION_NAME,
  TRANSACTION_REPRESENTATIVE_COUNT,
  TRANSACTION_RESULT,
  TRANSACTION_SAMPLED,
  TRANSACTION_TYPE,
} from '../../../../common/es_fields/apm';
import { RollupInterval } from '../../../../common/rollup';
import { asMutableArray } from '../../../../common/utils/as_mutable_array';
import { APMEventClient } from '../../../lib/helpers/create_es_client/create_apm_event_client';
import { transactionMapping } from '../../../utils/es_fields_mappings';

export async function getTransactionByName({
  transactionName,
  serviceName,
  apmEventClient,
  start,
  end,
}: {
  transactionName: string;
  serviceName: string;
  apmEventClient: APMEventClient;
  start: number;
  end: number;
}) {
  const resp = await apmEventClient.search('get_transaction', {
    apm: {
      sources: [
        {
          documentType: ApmDocumentType.TransactionEvent,
          rollupInterval: RollupInterval.None,
        },
      ],
    },
    body: {
      track_total_hits: false,
      size: 1,
      terminate_after: 1,
      query: {
        bool: {
          filter: asMutableArray([
            { term: { [TRANSACTION_NAME]: transactionName } },
            { term: { [SERVICE_NAME]: serviceName } },
            ...rangeQuery(start, end),
          ]),
        },
      },
      fields: [
        TRANSACTION_REPRESENTATIVE_COUNT,
        TRANSACTION_RESULT,
        TRANSACTION_SAMPLED,
        TRANSACTION_ID,
        TRANSACTION_DURATION,
        TRANSACTION_TYPE,
        TRANSACTION_NAME,
        SERVICE_NODE_NAME,
        SERVICE_NODE_NAME,
        SERVICE_NAME,
        SERVICE_FRAMEWORK_NAME,
        TRACE_ID,
        AGENT_NAME,
        AGENT_VERSION,
        EVENT_SUCCESS_COUNT,
        EVENT_OUTCOME,
        PROCESSOR_EVENT,
        PROCESSOR_NAME,
        DATA_STREAM_NAMESPACE,
        DATA_STEAM_TYPE,
        DATA_STREAM_DATASET,
        SPAN_ID,
        OBSERVER_HOSTNAME,
        OBSERVER_TYPE,
        OBSERVER_VERSION,
        OBSERVER_VERSION_MAJOR,
        TIMESTAMP,
        AT_TIMESTAMP,
        LABEL_NAME,
        LABEL_GC,
        LABEL_TYPE,
        LABEL_TELEMETRY_AUTO_VERSION,
        LABEL_LIFECYCLE_STATE,
      ],
    },
  });

  return transactionMapping(resp.hits.hits[0]);
}
