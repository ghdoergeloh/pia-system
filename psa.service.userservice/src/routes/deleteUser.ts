/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../handlers/usersHandler';

const route: ServerRoute = {
  path: '/user/users/{username}',
  method: 'DELETE',
  handler: UsersHandler.deleteOne,
  options: {
    description: 'deletes a user and all its data',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to delete')
          .required(),
      }).unknown(),
      query: Joi.object({
        requested_for: Joi.string()
          .description(
            'the username who was selected for deletion confirmation'
          )
          .optional(),
      }).unknown(),
    },
  },
};

export default route;
