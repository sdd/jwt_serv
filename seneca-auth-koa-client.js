'use strict';

var     _ = require('lodash'),
    Promise = require('bluebird'),
    seneca = Promise.promisifyAll(require('seneca')()),
    router = require('koa-router')();

const defaults = {
    auth_url: '/auth/:strategy',
    callback_url: '/auth/:strategy/callback'
};

const scriptResponse = "<script>try{window.opener.postMessage('authTokenSet')}catch(e){}window.close()</script>";

module.exports = function(options) {
    options = _.extend(defaults, options);

    var buildAuthArgs = function(ctx) {
        var queryParams = ['request_token', 'verify_token', 'oauth_token'];
        var sessionParams = ['oauth_token_secret'];
        var authArgs = _.pick(ctx.req.query, queryParams);
        authArgs = authArgs.extend(_.pick(ctx.session), sessionParams);
        authArgs.auth = 'authenticate';
        authArgs.strategy = ctx.strategy;
        return authArgs;
    };

    router.param('strategy', function *(strategy, next) {
        this.strategy = strategy;
        if (!this.strategy) return this.status = 404;
        yield next;
    });

    router.get(options.auth_url, function* () {
        this.body = yield seneca.actAsync(buildAuthArgs(this));
    });

    router.get(options.callback_url, function* () {
        var authResponse = yield seneca.actAsync(buildAuthArgs(this));

        this.cookies.set('jwt', authResponse.jwt, { signed: true });
        this.body = scriptResponse;
    });

    return router.middleware();
};
