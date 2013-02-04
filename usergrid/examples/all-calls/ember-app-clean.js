var usergrid_request = {
  username:"demo",
  password:"user123",
  orgName:"wesleyhales",
  appName:"sandbox",
  endpointName:"users",
  grant_type: "password"
};

window.UserGrid = Ember.Application.create();

UserGrid.deferReadiness();

jQuery.getJSON('https://api.usergrid.com/'+ usergrid_request.orgName +'/'+ usergrid_request.appName +'/token?username=' + usergrid_request.username + '&password=' + usergrid_request.password + '&grant_type=password', function(token) {
  console.log('token',token);
  //storing for now, need to add to later request
  UserGrid.token = token;
  UserGrid.advanceReadiness();
});

UserGrid.User =  DS.Model.extend({
  uuid: DS.attr('string')
});

UserGrid.Users = DS.Model.extend({
  users: DS.hasMany(UserGrid.User)
});

UserGrid.RESTAdapter = DS.RESTAdapter.extend({
//  serializer: UserGrid.serializer,
  url: 'https://api.usergrid.com/'+ usergrid_request.orgName +'/'+ usergrid_request.appName,
  findAll: function(store, type, since) {
    var root = this.rootForType(type);
    this.ajax(this.buildURL(root), "GET", {
      data: this.sinceQuery(since),
      success: function(json) {

        json = {users:json.entities};
        console.log('findAll2 json ', json);
        Ember.run(this, function(){
          this.didFindAll(store, type, json);
        });
      }
    });
  }

});

UserGrid.RESTAdapter.configure('plurals',{
  users: 'users'
});

UserGrid.RESTAdapter.map('UserGrid.User', {
  primaryKey: 'uuid'
});


UserGrid.Store = DS.Store.extend({
  revision: 11,
  adapter: UserGrid.RESTAdapter.create({
    bulkCommits: false//,
//    namespace: "api/v1"
  })
});

UserGrid.Router.map(function() {
  this.resource('users', { path: '/' }, function() {
    this.route('active');
  });
});

UserGrid.UsersIndexRoute = Ember.Route.extend({
  setupController: function() {
    var users = UserGrid.User.find();
    this.controllerFor('users').set('users', users);
  }
});

