/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import { QuestionnaireserviceClient } from '@pia-system/lib-http-clients-internal';

export const questionnaireserviceClient = new QuestionnaireserviceClient(
  config.services.questionnaireservice.url
);
