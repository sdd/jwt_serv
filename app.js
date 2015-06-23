'use strict';

var config = require('config-layered')();
var koa = require('koa');
var jwt = require('koa-jwt');
var session = require('koa-session');

var seneca = require('seneca')();
seneca.use('seneca-bluebird');

// start the microservices in-process
var authHandler = require('alt-auth-seneca')(config, seneca);
var userHandler = require('alt-user-seneca')(config, seneca);
var apiKeyHandler = require('./seneca-apiKey')(config, seneca);

var app = koa();
app.keys = config.koa.keys;
app.use(session(app));

app.use(jwt(config.jwt).unless({ path: [/^\/($|public|auth|connect)/] }));

app.use(require('koa-static')('public'));

app.use(authHandler.koa());
app.use(userHandler.koa());

// api key submission routes
// app.use();

require('./auto-serve-ssl')(app.callback(), config);
