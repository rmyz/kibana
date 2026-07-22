/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React from 'react';
import { EuiMarkdownFormat, useEuiTheme } from '@elastic/eui';

export function InvestigationFormattedText({
  text,
  subdued = false,
  bold = false,
}: {
  text: string;
  subdued?: boolean;
  bold?: boolean;
}): React.ReactElement {
  const { euiTheme } = useEuiTheme();

  return (
    <div
      css={
        bold
          ? css`
              font-weight: ${euiTheme.font.weight.bold};

              p,
              span,
              code {
                font-weight: ${euiTheme.font.weight.bold};
              }
            `
          : undefined
      }
    >
      <EuiMarkdownFormat textSize="s" color={subdued ? 'subdued' : undefined}>
        {text}
      </EuiMarkdownFormat>
    </div>
  );
}
