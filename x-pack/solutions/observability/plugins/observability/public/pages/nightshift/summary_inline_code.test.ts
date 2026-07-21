/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { parseSummaryInlineCode } from './summary_inline_code';

describe('parseSummaryInlineCode', () => {
  it('parses backtick-wrapped tokens into code segments', () => {
    expect(parseSummaryInlineCode('Latency on `web-frontend` rose.')).toEqual([
      { type: 'text', value: 'Latency on ' },
      { type: 'code', value: 'web-frontend' },
      { type: 'text', value: ' rose.' },
    ]);
  });

  it('returns plain text when there are no backticks', () => {
    expect(parseSummaryInlineCode('Plain summary')).toEqual([
      { type: 'text', value: 'Plain summary' },
    ]);
  });
});
