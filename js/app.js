function stubEndpointForHttpRequest(url, json) {
    $.mockjax({
        url: url,
        dataType: 'json',
        responseText: json
    });
}

$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 0;

var people = [{firstName: 'toran', lastName: 'billups'}, {firstName: 'todd', lastName: 'zombie'}];
var cats = [{firstName: 'cat', lastName: 'hat'}, {firstName: 'mat', lastName: 'rat'}];
stubEndpointForHttpRequest('/api/people/', people);
stubEndpointForHttpRequest('/api/cats/', cats);

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
        $.getJSON('/api/people/').then(function(response) {
            response.forEach(function(hash) {
                var person = App.Person.create(hash);
                Ember.run(self.people, self.people.pushObject, person);
            })
        });
        $.getJSON('/api/cats/').then(function(response) {
            response.forEach(function(hash) {
                var cat = App.Person.create(hash);
                Ember.run(self.people, self.people.pushObject, cat);
            })
        });
        return this.people;
    }
});
