const Boom = require('@hapi/boom');
const ValidationError = require('../ValidationError');

module.exports = bookshelf => (modelName, column, message, constraintOptions) => (value, validatorOptions) => {
  const options = Object.assign(
    {
      convert: true,
      return404: true,
      fetchOptions: {}
    },
    validatorOptions || {},
    constraintOptions || {}
  );

  const where = {};
  where[column] = value;

  return bookshelf.model(modelName)
    .where(where)
    .fetch(options.fetchOptions)
    .then(model => {
      if (!model) {
        let throwable;
        if (options.return404) {
          throwable = Boom.notFound(message || 'Row does not exist');
        } else {
          throwable = new ValidationError(message || 'Row does not exist', 'rowExists');
        }
        throw throwable;
      } else {
        return options.convert ? model : value;
      }
    });
};
