'use strict';

var config = require('config-layered')();
var koa = require('koa');
var jwt = require('koa-jwt');
var session = require('koa-session');

var seneca = require('seneca')();
seneca.use('seneca-bluebird');

// start the microservices in-process
var authHandler = require('./seneca-auth')(config, seneca);
var userHandler = require('./seneca-user')(config, seneca);

var app = koa();
app.keys = config.koa.keys;
app.use(session(app));

app.use(jwt(config.jwt).unless({ path: [/^\/($|public|auth|connect)/] }));

app.use(require('koa-static')('public'));

app.use(authHandler.koa());
app.use(userHandler.koa());

require('./auto-serve-ssl')(app.callback(), config);
