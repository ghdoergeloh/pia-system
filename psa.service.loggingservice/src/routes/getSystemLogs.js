const Joi = require('joi');
const systemLogHandler = require('../handlers/systemLogHandler');

module.exports = {
  path: '/log/systemLogs',
  method: 'GET',
  handler: systemLogHandler.getSystemLogs,
  config: {
    description: 'returns log list for sysadmin filtered by query params',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      query: Joi.object({
        fromTime: Joi.date()
          .description('begin of the time interval you want to search')
          .empty('')
          .default(new Date(0)),
        toTime: Joi.date()
          .description('the end of the time interval you want to search')
          .empty('')
          .default(() => new Date()),
        types: Joi.array()
          .items(
            Joi.string().valid(
              'sample',
              'study',
              'study_change',
              'proband',
              'partial',
              'compliance',
              'personal'
            )
          )
          .description('an array with log types that should be returned')
          .required()
          .single(),
      }).unknown(),
    },
  },
};
