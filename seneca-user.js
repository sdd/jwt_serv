/**
 * Created by scotty on 31/05/2015.
 */
'use strict';

var _ = require('lodash');
var router = require('koa-router')();

var r = require('rethinkdb');
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
	provider   : type.string(),
	identifier : type.string()
});

Login.ensureIndex('identifier');
//Login.ensureIndex('identifier', function(doc) { return [doc('provider'), doc('accountId')] }, { multi: true });

// Join the models
User.hasMany(Login, 'Logins', 'id', 'userId');
Login.belongsTo(User, 'user', 'userId', 'id');

module.exports = function(seneca_instance) {
	var seneca = seneca_instance || require('seneca')();

	// pass in a passport user profile. If the user exists, return
	// a new User object. If not, register the user and return the new User.
	seneca.add({system: 'user', action: 'login'}, function(args, done) {

		var userId = null;

		Login.getAll(`${args.query.user.userdata.provider}-${args.query.user.userdata.id}`, {index: 'identifier'}).run()

		//Login.getAll(
		//	r.expr({ provider: args.user.userdata.provider, accountId: args.user.userdata.id }).coerceTo('array'),
		//	{ index: 'identifier' }
		//).run()

		.then(login => login.length ? login : Promise.reject())
		.catch(function(err) {

			if (err) throw err;

			// not found? Create User and Login
			args.query.user.userdata.accountId = args.query.user.userdata.id;
			delete args.user.userdata.id;
			args.query.user.userdata.identifier = `${args.query.user.userdata.provider}-${args.query.user.userdata.accountId}`;

			var login = new Login(args.query.user.userdata);
			var user = new User({ name: args.query.user.name });

			login.user = user;

			return login.saveAll().then(function() {
				userId = user.id;
			});
		}).then(login =>
			// at this point we should have a valid login.
			// use it to get the user so that we have a top
			// level user wth a linked login rather than the reverse
			User.get(login[0].userId || userId).getJoin()

		).then(function(user) {
			done(null, { success: true, user: user});
		}).catch(done);

	});

	seneca.add({system: 'user', action: 'get'}, function(args, done) {
		User.get(args.id).getJoin().then(function(user) {
			done(null, { success:true, user:user } );
		}).catch(function(error) {
			done(error);
		})
	});

    router.get('/user', function* () {
        if (_.get(this, 'state.user.user.id')) {
            var response = yield seneca.actAsync({
                system: 'user',
                action: 'get',
                id: this.state.user.user.id
            });

            if (response.success) {
                return this.body = response;
            }
        }

        this.status = 500;
    });

	return router;
};
