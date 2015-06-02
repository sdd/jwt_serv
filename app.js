'use strict';

var koa = require('koa');
var jwt = require('koa-jwt');
var session = require('koa-session');

var seneca = require('seneca')();
seneca.use('seneca-bluebird');

var authHandler = require('./seneca-auth')(seneca);
var userHandler = require('./seneca-user')(seneca);

var app = koa();
app.keys = ['SeeCr3Ts'];
app.use(session(app));

// Middleware below this line is only reached if JWT token is valid
// unless the URL is root or starts with '/public, /auth, or /connect'
app.use(jwt({ secret: process.env.JWT_KEY }).unless({ path: [/^\/($|public|auth|connect)/] }));

app.use(require('koa-static')('public'));

// delegate authentication to seneca auth client
app.use(require('./seneca-auth-koa')(seneca));

app.use(userHandler.routes());

require('./auto-serve-ssl')(app.callback(), 3018);
