angular.module('TodoNgPouchdb', ['ionic','pouchdb'])
  .controller('TodoCtrl', function($scope, $ionicPopup, $ionicListDelegate, pouchCollection) {

    $scope.tasks = pouchCollection("user-db-test", "collecton2");

    $scope.toggleCompletion = function(task) {
      task.completed = !task.completed;
      $scope.tasks.$update(task);
    };

    $scope.deleteTask = function(task) {
      $scope.tasks.$remove(task);
    };

    $scope.newTask = function() {
      $ionicPopup.prompt({
        title: "New Task",
        template: "Enter task:",
        inputPlaceholder: "What do you need to do?",
        okText: 'Create task'
      }).then(function(res) {    // promise
        if (res) $scope.tasks.$add({title: res, completed: false});
      })
    };

    $scope.editTask = function(task) {
      $scope.data = { response: task.title }; // A hack to pre-populate prompt
      $ionicPopup.prompt({
        title: "Edit Task",
        scope: $scope
      }).then(function(res) {    // promise
        if (res !== undefined && task.title !== $scope.data.response) {
          task.title = $scope.data.response;
          $scope.tasks.$update(task);
        } // response not res has new title (hack)
        $ionicListDelegate.closeOptionButtons();
      })
    };

    $scope.online = false;
    $scope.toggleOnline = function() {
      $scope.online = !$scope.online;
      if ($scope.online) {  // Read http://pouchdb.com/api.html#sync
        $scope.tasks.$syncOn();
      } else {
        $scope.tasks.$syncOff()
      }
    };
  })

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  });
