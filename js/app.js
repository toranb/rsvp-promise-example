function stubEndpointForHttpRequest(url, json, status) {
    if (status == null) {
        status = 200;
    }
    $.mockjax({
        type: "GET",
        url: url,
        status: status,
        dataType: 'json',
        responseText: json
    });
}

$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 0;

var people = [{firstName: 'toran', lastName: 'billups'}, {firstName: 'todd', lastName: 'zombie'}];
var cats = [{firstName: 'cat', lastName: 'hat'}, {firstName: 'mat', lastName: 'rat'}];
stubEndpointForHttpRequest('/api/people/', people, 200);
stubEndpointForHttpRequest('/api/cats/', cats, 200);
//stubEndpointForHttpRequest('/api/cats/', "ajax blew up", 400);

App = Ember.Application.create();

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

        var peoplePromise = new Ember.RSVP.Promise(function(resolve, reject) {
            $.getJSON('/api/people/', resolve).fail(reject);
        });

        var catPromise = new Ember.RSVP.Promise(function(resolve, reject) {
            $.getJSON('/api/cats/', resolve).fail(reject);
        });

        Ember.RSVP.all([peoplePromise, catPromise]).then(function(things) {
            things.forEach(function(thing) {
                thing.forEach(function(hash) {
                    var thing = App.Person.create(hash);
                    Ember.run(self.people, self.people.pushObject, thing);
                });
            });
        }, function(value) {
            alert(value.status + ": promise failed " + value.responseText);
        });

        return this.people;
    }
});
