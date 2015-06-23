'use strict';

var _ = require('lodash');

var r      = require('rethinkdb');
var thinky = require('thinky')();
var type   = thinky.type;

var User = thinky.createModel('User', {
	id   : type.string(),
	name : type.string(),
	email: type.string()
});

var ApiKey = thinky.createModel('ApiKey', {
	id        : type.string(),
	userId    : type.string(),
	name      : type.string(),
	disabled  : type.string()
});

// Join the models
User.hasMany(ApiKey, 'Logins', 'id', 'userId');
ApiKey.belongsTo(User, 'user', 'userId', 'id');

module.exports     = function(config, seneca_instance) {
	var seneca = seneca_instance || require('seneca')();

	seneca.addAsync({ system: 'apiKey', action: 'create' }, function(args) {
		var apiKey = new ApiKey({
			userId: args.userId,
			name: args.name,
			disabled: false
		});

		return apiKey.saveAll()
			.then(apiKey => ({ success: true, apiKey: apiKey }))
			.catch(err => ({ success: false, error: err }));
	});

	seneca.addAsync({ system: 'apiKey', action: 'get' }, function(args) {
		return ApiKey.get(args.id)
			.then(apiKey => ({ success: true, apiKey: apiKey }))
	});

	seneca.addAsync({ system: 'apiKey', action: 'enable' }, function(args) {
		return ApiKey.get(args.id)
			.then(function(apiKey) {
				apiKey.disabled = false;
				return apiKey.saveAll();
			})
			.then(apiKey => ({ success: true, apiKey: apiKey }))
			.catch(err => ({ success: false, error: err }));
	});

	seneca.addAsync({ system: 'apiKey', action: 'disable' }, function(args) {
		return ApiKey.get(args.id)
			.then(function(apiKey) {
				apiKey.disabled = true;
				return apiKey.saveAll();
			})
			.then(apiKey => ({ success: true, apiKey: apiKey }))
			.catch(err => ({ success: false, error: err }));
	});

	seneca.addAsync({ system: 'apiKey', action: 'isValid' }, function(args) {
		return ApiKey.get(args.id)
			.then(valid => ({ success: true, valid: apiKey.enabled }))
			.catch(err => ({ success: !err, valid: false, error: err }));
	});

	return {
		koa: function() { return require('./seneca-apiKey-koa')(seneca); }
	};
};
module.exports.koa = function(seneca) { return require('./seneca-apiKey-koa')(seneca); };
