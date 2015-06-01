'use strict';
var     _ = require('lodash'),
    router = require('koa-router')();

const defaults = {
    auth_url: '/auth/:strategy',
    callback_url: '/auth/:strategy/callback'
};

const scriptResponse = function(message) {
	return `<script>try{window.opener.postMessage('${message}',window.location.origin)}catch(e){}window.close()</script>`;
};

module.exports = function(seneca_instance, options) {
    var seneca = seneca_instance || require('seneca')();

    options = _.extend(defaults, options);

    const buildAuthArgs = function(ctx) {
        var queryParams = ['request_token', 'oauth_verifier', 'oauth_token'];
        var sessionParams = ['oauth_token_secret'];
        var authArgs = _.pick(ctx.request.query, queryParams);
        authArgs = _.extend(authArgs, _.pick(ctx.session, sessionParams));
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
        var result = yield seneca.actAsync(buildAuthArgs(this));
        if (result.oauth_token_secret) {
            this.session.oauth_token_secret = result.oauth_token_secret;
            delete result.oauth_token_secret;
        }
        this.body = result;
    });

    router.get(options.callback_url, function* () {

        var authResponse = yield seneca.actAsync(buildAuthArgs(this));

        if (authResponse.success && authResponse.result === 'success') {
	        console.info(authResponse);
            this.cookies.set('jwt', authResponse.user, { signed: true });
	        this.body = scriptResponse('authTokenSet');
        } else {
	        this.body = scriptResponse('authTokenFailed');
        }
    });

    return router.middleware();
};
