/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  ApmSynthtraceEsClient,
  OtelSynthtraceEsClient,
  createLogger,
  LogLevel,
  ApmSynthtraceKibanaClient,
} from '@kbn/apm-synthtrace';
import { Readable } from 'stream';
import { ApmFields, Serializable, SynthtraceGenerator } from '@kbn/apm-synthtrace-client';
import { coreWorkerFixtures } from '../../worker';

export interface SynthtraceFixture {
  synthtraceEsClient: {
    index: (
      events: SynthtraceGenerator<ApmFields> | Array<Serializable<ApmFields>>
    ) => Promise<void>;
    clean: ApmSynthtraceEsClient['clean'];
  };
  synthtraceOtelEsClient: {
    index: (
      events: SynthtraceGenerator<ApmFields> | Array<Serializable<ApmFields>>
    ) => Promise<void>;
    clean: OtelSynthtraceEsClient['clean'];
  };
}

export const synthtraceFixture = coreWorkerFixtures.extend<SynthtraceFixture>({
  synthtraceEsClient: async ({ esClient, config, kbnUrl }, use) => {
    const logger = createLogger(LogLevel.info);
    const { username, password } = config.auth;
    const target = new URL(kbnUrl.toString());
    target.username = username;
    target.password = password;

    const apmKibanaClient = new ApmSynthtraceKibanaClient({
      logger: createLogger(LogLevel.info),
      target: url,
    });

    const version = await apmKibanaClient.fetchLatestApmPackageVersion();
    await apmKibanaClient.installApmPackage(version);
    const synthtraceEsClient = new ApmSynthtraceEsClient({
      client: esClient,
      logger,
      refreshAfterIndex: true,
      version,
    });

    synthtraceEsClient.pipeline(
      synthtraceEsClient.getDefaultPipeline({ includeSerialization: false })
    );

    const index = async (events: SynthtraceGenerator<ApmFields> | Array<Serializable<ApmFields>>) =>
      await synthtraceEsClient.index(
        Readable.from(Array.from(events).flatMap((event) => event.serialize()))
      );

    const clean = async () => await synthtraceEsClient.clean();

    await use({ index, clean });

    // cleanup function after all tests have ran
    await synthtraceEsClient.clean();
  },
  synthtraceOtelEsClient: async ({ esClient }, use, testInfo) => {
    const logger = createLogger(LogLevel.info);

    const synthtraceOtelEsClient = new OtelSynthtraceEsClient({
      client: esClient,
      logger,
      refreshAfterIndex: true,
    });

    synthtraceOtelEsClient.pipeline(
      synthtraceOtelEsClient.getDefaultPipeline({ includeSerialization: false })
    );

    const index = async (events: SynthtraceGenerator<ApmFields> | Array<Serializable<ApmFields>>) =>
      await synthtraceOtelEsClient.index(
        Readable.from(Array.from(events).flatMap((event) => event.serialize()))
      );

    const clean = async () => await synthtraceOtelEsClient.clean();

    await use({ index, clean });

    // cleanup function after all tests have ran
    await synthtraceOtelEsClient.clean();
  },
});
