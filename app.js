'use strict';

var _ = require('lodash');
var seneca = require('seneca')();
var koa = require('koa');
var session = require('koa-session');

var authHandler = require('./seneca-auth-handler');

var app = koa();
app.keys = ['SeeCr3Ts'];
app.use(session(app));
app.use(require('koa-static')('public'));

app.use(require('./seneca-auth-koa-client')());

app.listen(3018);
console.log('listening on port 3018');

/*
seneca.act({ auth: 'authenticate', strategy: 'twitter' }, function(err, out) {
    if (err) console.error(err);
    console.log(JSON.stringify(out));
});

seneca.act({
    auth: 'authenticate',
    oauth_token: '4LdWqNOnwLN1rRyUm5NEvbwmT0XAtP83',
    strategy: 'twitter',
    oauth_token_secret: 'ykHPbxkGF0D6o5GfZj99Hpc7aBf3XV25'
}, function(err, out) {
    if (err) console.error(err);
    console.log(JSON.stringify(out));
});
