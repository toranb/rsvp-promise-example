function stubEndpointForHttpRequest(url, json, status) {
    if (status == null) {
        status = 200;
    }

    $.mockjax({
        type: "GET",
        url: url,
        status: status,
        responseText: json
    });
}

$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 0;

var people = [{firstName: 'toran', lastName: 'billups'}, {firstName: 'todd', lastName: 'zombie'}];
stubEndpointForHttpRequest('/api/people/', people, 200);

App = Ember.Application.create({
  setError: function(error){
      this.set('error', error);
  }
});

App.Router.map(function() {
    this.resource("people", { path: "/" });
});

App.PeopleRoute = Ember.Route.extend({
    model: function() {
        return App.Person.find();
    }
});

App.PeopleController = Ember.ArrayController.extend({
    actions: {
        addPerson: function() {
            var person = {
                firstName: this.get('firstName'),
                lastName: this.get('lastName')
            };
            App.Person.add(person);
        },
        deletePerson: function(person) {
            App.Person.remove(person);
        }
    }
});

App.Person = Ember.Object.extend({
    firstName: '',
    lastName: '',
    fullName: function() {
        var firstName = this.get('firstName');
        var lastName = this.get('lastName');
        return firstName + ' ' + lastName;
    }.property('firstName', 'lastName')
});

var ajaxPromise = function(url, type, hash) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
        hash = hash || {};
        hash.url = url;
        hash.type = type;
        hash.dataType = 'json';

        hash.success = function(json) {
            Ember.run(null, resolve, json);
        };

        hash.error = function(json) {
            Ember.run(null, reject, json);
        };

        $.ajax(hash);
    });
}

App.Person.reopenClass({
    people: [],
    add: function(hash) {
        var person = App.Person.create(hash);
        this.people.pushObject(person);
    },
    remove: function(person) {
        this.people.removeObject(person);
    },
    find: function() {
        var self = this;

        var peoplePromise = ajaxPromise('/api/people/', "GET");

        Ember.RSVP.all([peoplePromise]).then(function(things) {
            things.forEach(function(thing) {
                thing.forEach(function(hash) {
                    var thing = App.Person.create(hash);
                    Ember.run(self.people, self.people.pushObject, thing);
                });
            });
        }, function(serverResponse) {
            App.setError(serverResponse.responseJSON.error);
        });

        return this.people;
    }
});
