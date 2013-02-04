
//var usergrid_request = {
//  username:"fred",
//  password:"barney",
//  orgName:"yourorgname",
//  appName:"yourappname",
//  endpointName:"users",
//  grant_type: "password"
//};

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

  $scope.isDeep = function(item){
    //can be better, just see if object for now
    return (Object.prototype.toString.call(item) === "[object Object]");
  };

  var auth_token;
  function refreshData(){

    if(typeof(Storage)!=="undefined" && localStorage.getItem('token12')) {
      auth_token = localStorage.getItem('token12');
    }
     return Project($scope.orgName,$scope.appName,$scope.endpointName).get({'access_token':auth_token}, angular.noop,
       function(responseFail){
//         console.log('responseSuccess----',responseFail.status,responseFail);
       if(responseFail.status === 401){
         //we reached the request limit, so use account login
           console.log('login');
           loginUser();
       }else{
         //login failed for some other reason, maybe stale token?
         localStorage.setItem('token12', undefined);
           if(responseFail.status !== 400){
              refreshData(); //try again
           }
       }

     }, function(responseSuccess) {

//       console.log('responseSuccess----',responseSuccess.status,responseSuccess);
     });
    //  $scope.projects = Project.get({'userId': 123}, function() {});
    //  $scope.projects = Project.query(); only use query when returns array
  }

  function loginUser(){
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