/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../handlers/usersHandler';

const route: ServerRoute = {
  path: '/user/users/ids/{ids}',
  method: 'GET',
  handler: UsersHandler.getProbandByIDS,
  options: {
    description: 'get a user by his ids',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        ids: Joi.string().description('the ids/uuid of the user').required(),
      }).unknown(),
    },
  },
};

export default route;
