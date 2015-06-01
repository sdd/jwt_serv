/**
 * Created by scotty on 31/05/2015.
 */
'use strict';

var _ = require('lodash');

var thinky = require('thinky')();
var type = thinky.type;

var User = thinky.createModel('User', {
	id  : type.string(),
	name: type.string(),
	email: type.string()
});

var Login = thinky.createModel('Login', {
	id         : type.string(),
	userId     : type.string(),
	accountId  : type.string(),
	provider   : type.string()
});

Login.ensureIndex('identifier', doc => doc('provider').add(doc('accountId')));
Login.ensureIndex('identifier', [r.row("last_name"), r.row("first_name")]));

// Join the models
User.hasMany(Login, 'Logins', 'id', 'userId');
Login.belongsTo(User, 'user', 'userId', 'id');

module.exports = function(seneca_instance) {
	var seneca = seneca_instance || require('seneca')();

	// pass in a passport user profile. If the user exists, return
	// a new User object. If not, register the user and return the new User.
	seneca.add({system: 'user', action: 'login'}, function(args, done) {

		var identifier = `${args.user.userdata.provider}-${args.user.userdata.id}`;
		Login.get({
			accountId: args.user.userdata.id,
			provider: args.user.userdata.provider
		}).run()
		.catch(function() {
			// not found? Create User and Login
			args.user.userdata.accountId = args.user.userdata.id;
			delete args.user.userdata.id;

			var login = new Login(args.user.userdata);
			var user = new User({ name: args.user.name });

			login.user = user;

			return login.saveAll();
		}).then(function(login) {
			// at this point we should have a valid login.
			// use it to get the user so that we have a top
			// level user wth a linked login rather than the reverse
			return User.get(login.userId).getJoin();
		}).then(function(user) {
			done(null, user);
		}).catch(done);

	});

	seneca.add({system: 'user', action: 'get'}, function(args, done) {
		User.get(args.id).getJoin().then(function(user) {
			done(null, user);
		}).catch(function(error) {
			done(error);
		})
	});

	return seneca;
};
