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

jQuery.getJSON('https://api.usergrid.com/'+ usergrid_request.orgName +'/'+ usergrid_request.appName +'/token?username=demo&password=user123&grant_type=password', function(token) {
  console.log('token',token);
  UserGrid.token = token;
  UserGrid.advanceReadiness();
});

UserGrid.Router.map(function() {
  this.resource('entities', { path: '/' }, function() {
    this.route('active');
    this.route('completed');
  });
});

UserGrid.EntitiesRoute = Ember.Route.extend({
  enableLogging: true
//  model: function() {
//    return UserGrid.User.find();
//  }
});

UserGrid.EntitiesIndexRoute = Ember.Route.extend({
  enableLogging: true,
  setupController: function() {
    console.log(UserGrid.Entities.find())
    var entities = UserGrid.Entities.find();
    this.controllerFor('entities').set('filteredUsers', entities);
  }
});


UserGrid.Entities =  DS.Model.extend({
  mappings: {
    action: UserGrid.Data
  },
  uuid: DS.attr('string')
});



UserGrid.Data = DS.Model.extend({
  mappings: {
    action: UserGrid.Data
  },
  action: DS.attr('string'),
  entities: DS.hasMany(UserGrid.Entities),
  uuid: DS.attr('string')
//  isCompleted: DS.attr('boolean'),

//  userDidChange: function() {
//    Ember.run.once(this, function() {
//      this.get('store').commit();
//    });
//  }.observes('isCompleted', 'title')
});





UserGrid.Store = DS.Store.extend({
  mappings: {
    action: UserGrid.Data
  },
  revision: 11,
  adapter: 'UserGrid.RESTAdapter'
});

//UserGrid.LSAdapter = DS.LSAdapter.extend({
//  namespace: 'users-emberjs'
//});

UserGrid.RESTSerializer = DS.RESTSerializer.extend({
  mappings: {
    action: UserGrid.Data
  },
  init: function() {
    this._super();

    this.map('action', {action: 'UserGrid.data'});
  },
  rootJSON: function(json, type, pluralize) {
    var root = this.rootForType(type);
    if (pluralize == 'pluralize') { root = this.pluralize(root); }
    var rootedJSON = {};
    rootedJSON[root] = json;
    return rootedJSON;
  }
});

UserGrid.RESTAdapter = DS.RESTAdapter.extend({

//  find: function(store, type, id) {
//    var root = this.rootForType(type);
//    var wrap = {};
//
//    this.ajax(this.buildURL(root, id), "GET", {
//      success: function(json) {
//        App.playerController.content = Ember.Object.create(json)
//      }
//    });
//  },
  mappings: {
    action: 'UserGrid.Data'
  },
  url: 'https://api.usergrid.com/'+ usergrid_request.orgName +'/'+ usergrid_request.appName,// + '?token=' + UserGrid.token.access_token
  serializer: UserGrid.RESTSerializer,
//  ajax: function(url, type, hash) {
//    hash.url = url;
//    hash.type = type;
//    hash.dataType = 'jsonp';
//    hash.contentType = 'application/json; charset=utf-8';
//    hash.context = this;
//    hash.data = hash.data || {}
////    hash.data.key = "596c42283236355f551a246256c62"
//    if (hash.data && type !== 'GET') {
//      hash.data = JSON.stringify(hash.data);
//
//    }
//
//    var old_s = hash.success;
//    hash.success = function(data){
//      result_type = url.substr(url.lastIndexOf('/') + 1);
//      var json = {}
//      json[result_type] = data.results;
//      console.log('---',json)
//      old_s.call(this,json);
//    }
//
//    jQuery.ajax(hash);
//    console.log('---hash: ',hash)
//  },
  findAll: function(store, type, since) {
    var root = this.rootForType(type);
    console.log('findAll2' + this.buildURL(root));
    this.ajax(this.buildURL(root), "GET", {
      data: this.sinceQuery(since),
      success: function(json) {
        console.log('findAll2 json ', Ember.Object.create(json));
        Ember.run(this, function(){
          this.didFindAll(store, type, json);
        });
      }
    });
  }
});

UserGrid.RESTAdapter.configure('plurals',{
  entities: 'users'
})

//UserGrid.RESTAdapter.configure('mapping',{
//  action: UserGrid.Data
//})

//UserGrid.RESTAdapter.registerTransform('object', {
//  serialize: function(serialized) {
//    return Em.isNone(serialized) ? {} : serialized;
//  },
//  deserialize: function(deserialized) {
//    return Em.isNone(deserialized) ? {} : deserialized;
//  }
//});

UserGrid.UsersController = Ember.ArrayController.extend({
  createUser: function() {
    // Get the user title set by the "New User" text field
    var title = this.get('newTitle');
    if (!title.trim()) { return; }

    // Create the new User model
    UserGrid.Entities.createRecord({
      title: title,
      isCompleted: false
    });

    // Clear the "New User" text field
    this.set('newTitle', '');

    // Save the new model
    this.get('store').commit();
  },

  clearCompleted: function() {
    var completed = this.filterProperty('isCompleted', true);
    completed.invoke('deleteRecord');

    this.get('store').commit();
  },

  remaining: function() {
    return this.filterProperty( 'isCompleted', false ).get( 'length' );
  }.property( '@each.isCompleted' ),

  remainingFormatted: function() {
    var remaining = this.get('remaining');
    var plural = remaining === 1 ? 'item' : 'items';
    return '<strong>%@</strong> %@ left'.fmt(remaining, plural);
  }.property('remaining'),

  completed: function() {
    return this.filterProperty('isCompleted', true).get('length');
  }.property('@each.isCompleted'),

  hasCompleted: function() {
    return this.get('completed') > 0;
  }.property('completed'),

  allAreDone: function( key, value ) {
    if ( value !== undefined ) {
      this.setEach( 'isCompleted', value );
      return value;
    } else {
      return !!this.get( 'length' ) &&
        this.everyProperty( 'isCompleted', true );
    }
  }.property( '@each.isCompleted' )
});







UserGrid.UserController = Ember.ObjectController.extend({
  isEditing: false,

  editUser: function() {
    this.set('isEditing', true);
  },

  removeUser: function() {
    var user = this.get('model');

    user.deleteRecord();
    user.get('store').commit();
  }
});







UserGrid.UserView = Ember.View.extend({
  tagName: 'li',
  classNameBindings: ['user.isCompleted:completed', 'isEditing:editing'],

  doubleClick: function(event) {
    this.set('isEditing', true);
  }
});





UserGrid.EditUserView = Ember.TextField.extend({
  classNames: ['edit'],

  valueBinding: 'user.title',

  change: function() {
    var value = this.get('value');

    if (Ember.isEmpty(value)) {
      this.get('controller').removeUser();
    }
  },

  focusOut: function() {
    this.set('controller.isEditing', false);
  },

  insertNewline: function() {
    this.set('controller.isEditing', false);
  },

  didInsertElement: function() {
    this.$().focus();
  }
});

