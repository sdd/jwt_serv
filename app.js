'use strict';

var koa = require('koa');
var jwt = require('koa-jwt');
var session = require('koa-session');

var seneca = require('seneca')();
seneca.use('seneca-bluebird');

// start the microservices in-process
var authHandler = require('./seneca-auth')(seneca);
var userHandler = require('./seneca-user')(seneca);

var app = koa();
app.keys = ['SeeCr3Ts'];
app.use(session(app));

app.use(jwt({ secret: process.env.JWT_KEY }).unless({ path: [/^\/($|public|auth|connect)/] }));

app.use(require('koa-static')('public'));

app.use(authHandler.koa());
app.use(userHandler.koa());

require('./auto-serve-ssl')(app.callback(), 3018);
