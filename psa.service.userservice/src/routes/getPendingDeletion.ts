/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingDeletionsHandler from '../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/user/pendingdeletions/{id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOne,
  options: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
