const Joi = require('joi');

const answersHandler = require('../handlers/answersHandler.js');

module.exports = {
  path: '/questionnaire/questionnaireInstances/{id}/answers',
  method: 'GET',
  handler: answersHandler.get,
  config: {
    description:
      'get the answers for the questionnaire instance if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
      }).unknown(),
    },
  },
};