var _ = require('lodash')
  , async = require('async')
  , emptyFn = function() {}
  , EventEmitter = require('events').EventEmitter
  ;

module.exports = function(options) {
  var defaults = { idProperty: '_id'
      }
    , self = new EventEmitter();

  options = _.extend({}, options, defaults);

  var data = {}
    , idSeq = 0;

  /**
   * Checks that the object has the ID property present, then checks
   * if the data object has that ID value present.
   *
   * Returns an Error to the callback if either of the above checks fail
   *
   * @param {Object} object to check
   * @param {Function} callback
   * @api private
   */
  function checkForIdAndData(object, callback) {
    var id = object[options.idProperty];

    if (id === undefined) {
      return callback(new Error('Object has no \''
        + options.idProperty + '\' property'));
    }

    if (data[id] === undefined) {
      return callback(new Error('No object found with \''
        + options.idProperty + '\' = \'' + id + '\''));
    }

    return callback(null);
  }

  function create(object, callback) {
    self.emit('create', object);
    callback = callback || emptyFn;
    object = _.clone(object);
    idSeq += 1;
    object[options.idProperty] = idSeq;
    data[idSeq] = object;
    callback(undefined, object);
  }

  function read(id, callback) {
    var query = {};
    self.emit('read', id);
    callback = callback || emptyFn;
    query[options.idProperty] = id;
    find(query, {}, function(error, objects) {
      callback(undefined, objects[0]);
    });
  }

  function update(object, overwrite, callback) {
    if (typeof overwrite === 'function') {
      callback = overwrite;
      overwrite = false;
    }
    self.emit('update', object, overwrite);
    callback = callback || emptyFn;
    var id = object[options.idProperty]
      , updatedObject = object;

    checkForIdAndData(object, function(error) {
      if (error) {
        return callback(error);
      }

      if (overwrite) {
        data[id] = object;
      } else {
        updatedObject = _.extend(data[id], object);
      }

      callback(undefined, updatedObject);
    });
  }

  function del(query, callback) {
    callback = callback || emptyFn;
    self.emit('delete', query);
    find(query, {}, function(error, objects) {
      if (objects.length === 0) {
        return callback(new Error('No items to delete with that query'));
      }
      async.forEach(objects, deleteOne, callback);
    });
  }

  /**
   * Deletes one object. Returns an error if the object can not be found
   * or if the ID property is not present.
   *
   * @param {Object} object to delete
   * @param {Function} callback
   * @api public
   */
  function deleteOne(object, callback) {

    callback = callback || emptyFn;
    self.emit('deleteOne', object);
    checkForIdAndData(object, function(error) {
      if (error) {
        return callback(error);
      }

      delete data[object[options.idProperty]];
      callback(undefined);
    });
  }

  /**
   * Performs a find on the data by search query.
   *
   * Sorting can be done similarly to mongo by providing a $sort option to
   * the options object.
   *
   * @param {Object} query to search by
   * @param {Object} search options
   * @param {Function} callback
   * @api public
   */
  function findByQuery(query, options, callback) {

    var foundObjects = Object.keys(data).filter(function(key) {
      return Object.keys(query).every(function(queryKey) {
        return data[key][queryKey] === query[queryKey];
      });
    });
    foundObjects = foundObjects.map(function(key) {
      return data[key];
    });

    if (options.$sort) {
      foundObjects.sort(function(a, b) {
        //TODO: Handle multiple sort properties
        var key = Object.keys(options.$sort)[0];
        if (a[key] === b[key]) {
          return 0;
        } else {
          // Ascending
          if (options.$sort[key] === 1) {
            return a[key] < b[key] ? -1 : 1;
          // Descending
          } else if (options.$sort[key] === -1) {
            return a[key] > b[key] ? -1 : 1;
          }
        }
      });
    }

    callback(undefined, foundObjects);
  }

  function find(query, options, callback) {
    self.emit('find', query);
    findByQuery(query, options, callback);
  }

  function findOne(query, options, callback) {
    self.emit('findOne', query);
    find(query, options, function(error, objects) {
      callback(undefined, objects[0]);
    });
  }

  function count(query, callback) {
    self.emit('count', query);
    find(query, options, function(error, objects) {
      callback(undefined, objects.length);
    });
  }

  _.extend(self, {
    create: create
    , read: read
    , update: update
    , deleteOne: deleteOne
    , 'delete': del
    , find: find
    , findOne: findOne
    , count: count
  });

  return self;

};