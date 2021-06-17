const Joi = require('joi');

const bloodSamplesHandler = require('../handlers/bloodSamplesHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{id}/bloodSamples',
  method: 'GET',
  handler: bloodSamplesHandler.getAllSamples,
  options: {
    description: 'returns blood sample list for proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string().description('the username of the proband').required(),
      }).unknown(),
    },
  },
};
