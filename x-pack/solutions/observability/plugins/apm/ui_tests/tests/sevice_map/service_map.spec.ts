/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect } from '@kbn/scout';
import { test } from '../../fixtures';
import { opbeans } from '../../fixtures/synthtrace/opbeans';

const start = '2021-10-10T00:00:00.000Z';
const end = '2021-10-10T00:01:00.000Z';

test.describe('Service Map', { tag: ['@ess', '@svlOblt'] }, () => {
  test.beforeEach(
    async ({ browserAuth, synthtraceEsClient, pageObjects: { serviceMapPage }, page }) => {
      await synthtraceEsClient.index(
        opbeans({
          from: new Date(start).getTime(),
          to: new Date(end).getTime(),
        })
      );
      await browserAuth.loginAsViewer();
      await serviceMapPage.goto();
      await page.waitForSelector(
        '[data-test-subj="kbnAppWrapper visibleChrome"] [aria-busy="false"]',
        { state: 'visible' }
      );
    }
  );

  test.afterAll(async ({ synthtraceEsClient }) => {
    await synthtraceEsClient.clean();
  });

  test('The page loads correctly', async ({ page }) => {
    expect(page.url()).toContain('/app/apm/service-map');
  });
});
