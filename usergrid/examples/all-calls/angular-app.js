
var usergrid_request = {
  username:"demo",
  password:"user123",
  orgName:"wesleyhales",
  appName:"sandbox",
  endpointName:"users",
  grant_type: "password"
};

angular.module('project', ['usergrid']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:ListCtrl, templateUrl:'list.html'}).
      otherwise({redirectTo:'/'});
  });
var inputValue = true;
function ListCtrl($scope, Project) {
  $scope.projects = refreshData();
  var refreshInput;

  $scope.declareEndpoint = function(e){
    //simple debounce/throttle
    if(!refreshInput){
      refreshInput = setTimeout(function(){
        $scope.projects = refreshData();
        refreshInput = false;
      },1000)
    }

  }

  function refreshData(){
    var auth_token;
    if(typeof(Storage)!=="undefined" && localStorage.getItem('token12')) {
      auth_token = localStorage.getItem('token12');
    }
     return Project($scope.orgName,$scope.appName,$scope.endpointName).get({'access_token':auth_token}, angular.noop,
       function(responseFail){
       if(responseFail.status === 401){
         //we reached the request limit, so use account login
          auth = Project(usergrid_request.orgName,
                         usergrid_request.appName,
                                              "token").get({
                                                          'username': encodeURIComponent(usergrid_request.username),
                                                          'password': usergrid_request.password,
                                                          'grant_type':usergrid_request.grant_type
                                                          }, function(loginResponseSuccess) {

              auth_token = loginResponseSuccess.access_token;

              if(typeof(Storage)!=="undefined" && auth_token!=="undefined"){
                localStorage.setItem('token12', auth_token);
              }
            }, function(loginResponseFail) {
              console.log('loginResponseFail----',loginResponseFail.status,loginResponseFail.data);
            });
         }else{
         //login failed for some other reason, maybe stale token?
         localStorage.setItem('token12', undefined);
           if(responseFail.status !== 400){
              refreshData(); //try again
           }
         }

     }, function(responseSuccess) {

       console.log('responseSuccess----',responseSuccess.status,responseSuccess);
     });
    //  $scope.projects = Project.get({'userId': 123}, function() {});
    //  $scope.projects = Project.query(); only use query when returns array
  }

}

angular.module('usergrid', ['ngResource']).
  factory('Project', function($resource) {
    return function(on,an,epn){
      console.log('e: ', on,an,epn);
      return $resource('https://api.usergrid.com/:orgName/:appName/:endpointName',
        {
          orgName:(on || usergrid_request.orgName),
          appName:(an || usergrid_request.appName),
          endpointName:(epn || usergrid_request.endpointName)
        },{
          getData: {method:'GET', isArray: false}
        });
    }
});

function debounce(func, wait) {
  var timer;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      timer = null;
      func.apply(context, args);
    }, wait);
  };
}

//app.factory('debounce', function($timeout, $q) {
//  return function(func, wait, immediate) {
//    var timeout;
//    var deferred = $q.defer();
//    return function() {
//      var context = this, args = arguments;
//      var later = function() {
//        timeout = null;
//        if(!immediate) {
//          deferred.resolve(func.apply(context, args));
//          deferred = $q.defer();
//        }
//      };
//      var callNow = immediate && !timeout;
//      if ( timeout ) {
//        $timeout.cancel(timeout);
//      }
//      timeout = $timeout(later, wait);
//      if (callNow) {
//        deferred.resolve(func.apply(context,args));
//        deferred = $q.defer();
//      }
//      return deferred.promise;
//    };
//  };
//});
//
//app.controller('MainCtrl', function($scope, debounce) {
//  $scope.msgs = [];
//  $scope.addMsg = function(msg) {
//    $scope.msgs.push(msg);
//    return msg;
//  };
//
//  $scope.addMsgDebounced = debounce($scope.addMsg, 2000, false);
//
//  $scope.logReturn = function(msg) {
//    var returned = $scope.addMsgDebounced(msg);
//    console.log('Log: ', returned);
//    returned.then(function(value) {
//      console.log('Resolved:', value);
//    });
//  };
//
//});