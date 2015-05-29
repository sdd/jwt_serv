'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var seneca = require('seneca')();
var koa = require('koa');
var session = require('koa-session');
seneca.actAsync = Promise.promisify(seneca.act, seneca);

var authHandler = require('./seneca-auth-handler')(seneca);

var app = koa();
app.keys = ['SeeCr3Ts'];
app.use(session(app));
app.use(require('koa-static')('public'));

app.use(require('./seneca-auth-koa-client')(seneca));

app.listen(3018);
console.log('listening on port 3018');
