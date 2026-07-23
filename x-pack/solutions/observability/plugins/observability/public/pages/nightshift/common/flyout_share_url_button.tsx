/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { EuiButtonIcon, EuiFlexItem, EuiToolTip, copyToClipboard } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useKibana } from '../../../utils/kibana_react';

export interface FlyoutShareUrlButtonProps {
  url: string;
  testSubj?: string;
}

export function FlyoutShareUrlButton({
  url,
  testSubj = 'nightshiftFlyoutShareUrlButton',
}: FlyoutShareUrlButtonProps): React.ReactElement {
  const { notifications } = useKibana().services;

  const shareLabel = i18n.translate('xpack.observability.nightshift.flyout.shareUrlAriaLabel', {
    defaultMessage: 'Copy link to this flyout',
  });

  const onShareClick = useCallback(() => {
    const copied = copyToClipboard(url);
    if (copied) {
      notifications.toasts.addSuccess({
        title: i18n.translate('xpack.observability.nightshift.flyout.shareUrlSuccess', {
          defaultMessage: 'Copied link to clipboard',
        }),
      });
    }
  }, [notifications.toasts, url]);

  return (
    <EuiFlexItem grow={false}>
      <EuiToolTip content={shareLabel} disableScreenReaderOutput>
        <EuiButtonIcon
          iconType="share"
          aria-label={shareLabel}
          data-test-subj={testSubj}
          onClick={onShareClick}
        />
      </EuiToolTip>
    </EuiFlexItem>
  );
}
