/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { SymptomDiaryHandler } from '../handlers/symptomDiaryHandler';
import Joi from 'joi';

const route: ServerRoute = {
  path: '/sormas/symptomdiary/external-data/{personUuid}',
  method: 'PUT',
  handler: SymptomDiaryHandler.putProband,
  options: {
    description: 'register a sormas contact person in PIA',
    auth: 'sormas-one-time-token',
    tags: ['api'],
    validate: {
      params: Joi.object({
        personUuid: Joi.string()
          .description('person UUID of contact person in SORMAS')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
