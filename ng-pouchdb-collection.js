angular.module('pouchdb')
  .factory('pouchCollection', function($timeout, pouchDB) {

    /**
     * @class item in the collection
     * @param item
     * @param {int} index             position of the item in the collection
     *
     * @property {String} _id         unique identifier for this item within the collection
     * @property {int} $index         position of the item in the collection
     */
    function PouchDbItem(item, index) {
      this.$index = index;
      angular.extend(this, item);
    }

    /**
     * create a pouchCollection
     * @param  {String} collectionUrl The pouchdb url where the collection lives
     * @return {Array}                An array that will hold the items in the collection
     */
    return function(userDB, collectionName) {
      var collection = [];
      var indexes = {};
      var db = collection.$db = new pouchDB(userDB);
      var remoteDb = new pouchDB("http://127.0.0.1:5984/"+userDB);
      var sync;

      // //insert the view this collection will use
      db.upsert('_design/' + collectionName, function (doc) {
        return {
          views: {
            collection: {
              map: "function(doc) { if (doc.type == '"+collectionName+"')  emit(null, doc)}"
            }
          }
        };
      }).then(function (res) {
        console.log("success added design doc", res);
        db.changes({
          live: true,
          filter: '_view',
          view: collectionName + '/collection'
        }).on('change', function (change) {
          console.log("@@@@@@@@")
          if (!change.deleted) {
              db.get(change.id).then(function(data) {
                if (indexes[change.id] == undefined) { // CREATE / READ
                  addChild(collection.length, new PouchDbItem(data, collection.length)); // Add to end
                  updateIndexes(0);
                } else { // UPDATE
                  var index = indexes[change.id];
                  var item = new PouchDbItem(data, index);
                  updateChild(index, item);
                }
              });
            } else if (collection.length && indexes[change.id]) { //DELETE
              console.log("Delete")
              removeChild(change.id);
              updateIndexes(indexes[change.id]);
            }
        }).on('error', function (err) {
          console.log("err changes", err);
        });
      }).catch(function (err) {
        console.log("doc already exist", err)
      });

      db.replicate.from(remoteDb).then(function(resp){
        console.log("complete", resp);
      }).catch(function(err){
        console.log(err);
      });

      function getIndex(prevId) {
        return prevId ? indexes[prevId] + 1 : 0;
      }

      function addChild(index, item) {
        indexes[item._id] = index;
        collection.splice(index, 0, item);
        console.log('added: ', index, item);
      }

      function removeChild(id) {
        var index = indexes[id];

        // Remove the item from the collection
        collection.splice(index, 1);
        indexes[id] = undefined;

        console.log('removed: ', id);
      }

      function updateChild(index, item) {
        collection[index] = item;
        console.log('changed: ', index, item);
      }

      function moveChild(from, to, item) {
        collection.splice(from, 1);
        collection.splice(to, 0, item);
        updateIndexes(from, to);
        console.log('moved: ', from, ' -> ', to, item);
      }

      function updateIndexes(from, to) {
        var length = collection.length;
        to = to || length;
        if (to > length) {
          to = length;
        }
        for (index = from; index < to; index++) {
          var item = collection[index];
          item.$index = indexes[item._id] = index;
        }
      }

      collection.$add = function(item) {
        angular.extend(item,{
          "type" : collectionName
        });
        console.log("add", item);
        db.post(angular.copy(item)).then(
          function(res) {
            item._rev = res.rev;
            item._id = res.id;
          }
        );
      };

      collection.$remove = function(itemOrId) {
        var item = angular.isString(itemOrId) ? collection[itemOrId] : itemOrId;
        db.remove(item)
      };

      collection.$update = function(itemOrId) {
        var item = angular.isString(itemOrId) ? collection[itemOrId] : itemOrId;
        var copy = {};
        angular.forEach(item, function(value, key) {
          if (key.indexOf('$') !== 0) {
            copy[key] = value;
          }
        });
        db.get(item._id).then(
          function(res) {
            db.put(copy, res._rev);
          }
        );
      };


      collection.$syncOn = function(){
        sync = db.sync(remoteDb, {live: true,retry: true})
          .on('change', function (change) {
            console.log("SYNC change", change);
            // yo, something changed!
          }).on('paused', function () {
            // replication was paused, usually because of a lost connection
            console.log("SYNC Paused");
          }).on('active', function (info) {
            console.log("SYNC Active", info);
            // replication was resumed
          }).on('error', function (err) {
            // totally unhandled error (shouldn't happen)
            console.log("SYNC Err", err);
        });
        return sync;
      }

      collection.$syncOff = function(){
        return sync.cancel();
      }

      return collection;
    };
  });