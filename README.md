## ng-pouchdb-collection
Pouchdb collection module for angular.  Using the "one db per user" methodology, plugin takes in the user db and a collection name.  Create a view for that collection, all dual bindings included for angular views, no need to call $scope.apply() 

Special Thanks to @danielzen for his starter [codebase](https://github.com/danielzen/ng-pouchdb)

Setup
---------

### Requirements

- CouchDB v1.3.0+ or IrisCouch
- [pouchdb](https://github.com/pouchdb/pouchdb)
- [pouchdb-upsert](https://github.com/pouchdb/upsert)
- [angular-pouchdb](https://github.com/angular-pouchdb/angular-pouchdb)


### Setup ng-pouchdb-collection
  TODO: add bower and node 

API
-------

```js
.controller('TodoCtrl', function(pouchCollection)
  $scope.tasks = pouchCollection("user-db-test", "collecton2");
```

#### Add to Collection

```js
$scope.tasks.$add({title: res, completed: false});

```

#### Update item in Collection

```js
$scope.tasks.$update(task);

```

#### Remove from Collection

```js
$scope.tasks.$remove(task);

```


### testing
  See demo folder with sample ionic project

### License

Released under the MIT License.
