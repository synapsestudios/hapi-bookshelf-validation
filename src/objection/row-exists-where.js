const Boom = require('boom');
const get = require('lodash.get');
const merge = require('lodash/merge');
const ValidationError = require('../ValidationError');

module.exports = (Model, column, whereColumn, contextValuePath, message, constraintOptions) =>
  function(value, validatorOptions) {
    const options = merge(
      {
        convert: true,
        return404: true,
        fetchOptions: { eager: '', eagerOptions: {}, eagerAlgorithm: 'WhereInEagerAlgorithm' },
      },
      validatorOptions || {},
      constraintOptions || {}
    );
    const contextValue = get(options.context, contextValuePath);

    const query = Model.query().where(column, '=', value);

    if (typeof contextValue !== 'undefined') {
      query.where(whereColumn, '=', contextValue);
    }
    return query
      .eagerAlgorithm(Model[options.fetchOptions.eagerAlgorithm])
      .eagerOptions(options.fetchOptions.eagerOptions)
      .eager(options.fetchOptions.eager)
      .then(function(rows) {
        if (rows.length === 0) {
          let throwable;
          if (options.return404) {
            throwable = Boom.notFound(message || 'Row does not exist');
          } else {
            throwable = new ValidationError(message || 'Row does not exist', 'rowExists');
          }
          throw throwable;
        } else {
          return options.convert ? rows : value;
        }
      });
  };