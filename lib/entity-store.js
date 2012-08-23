var _ = require('lodash')
  ;

module.exports = function(name, options) {

  var engine
    , defaults =
      { idProperty: '_id'
      , logger: console
      , engine: undefined
      };

  options = _.extend({}, defaults, options);

  // If no engine is passed then default to the memory store.
  engine = options.engine || require('./memory-engine')();

  engine.on('create', function(entity) {
    options.logger.info('Creating \'' + name + '\'', entity);
  });

  engine.on('update', function(entity) {
    options.logger.info('Updating \'' + name + '\'', entity);
  });

  engine.on('delete', function(query) {
    options.logger.info('Deleting \'' + name + '\'', query);
  });

  engine.on('deleteOne', function(entity) {
    options.logger.info('Deleting One \'' + name + '\'', entity);
  });

  engine.on('read', function(id) {
    options.logger.verbose('Reading \'' + name + '\'', id);
  });

  engine.on('find', function(query) {
    options.logger.verbose('Finding \'' + name + '\'', query);
  });

  engine.on('findOne', function(query) {
    options.logger.verbose('Finding One \'' + name + '\'', query);
  });

  engine.on('count', function(query) {
    options.logger.verbose('Count \'' + name + '\'', query);
  });

  engine.on('error', function(error) {
    options.logger.error('Error with \'' + name + '\'', error);
  });

  return engine;
};