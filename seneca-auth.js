'use strict';

var _ = require('lodash');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var jwt = require('jsonwebtoken');

const conf = {
    key    : process.env.TWITTER_KEY,
    secret : process.env.TWITTER_SECRET,
    urlhost: "https://localhost:3018"
};

passport.use('twitter', new TwitterStrategy({
        consumerKey   : conf.key,
        consumerSecret: conf.secret,
        callbackURL   : conf.urlhost + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
        let data = {
            nick       : profile.username,
            name       : profile.displayName,
            identifier : '' + profile.id,
            credentials: { token: token, secret: tokenSecret },
            userdata   : profile,
            when       : new Date().toISOString()
        };
        done(null, data);
    }
));

passport.framework(require('./passport-fw-seneca-json'));

var mapArgsToAuth = function(args, session) {
    const params = {
        session: ['request_token', 'oauth_token_secret'],
        query  : ['oauth_token', 'oauth_verifier']
    };
    session['oauth:' + args.strategy] = _.pick(args, params.session);

    return {
        session: session,
        query  : _.pick(args, params.query)
    }
};

var seneca = null;

module.exports = function(seneca_instance) {
    seneca = seneca_instance || require('seneca')();

    seneca.addAsync({system: 'auth', action: 'auth'}, function (args) {
        let auth = passport.authenticate(args.strategy);
        var session = {};

        return auth(mapArgsToAuth(args, session))
            .then(response => handler.get(response.result)(response, session, args.strategy))
    });

    var handler = {
        redirect: function(response, session, strategy) {
            response.oauth_token_secret = _.get(session, `['oauth:${strategy}'].oauth_token_secret`);
            return response;
        },

        success: function(response) {
            return seneca.actAsync({system: 'user', action: 'login', query: response})
                .then(function (response) {
                    var token = jwt.sign(
                        { user: { id: response.user.id, name: response.user.name } },
                        process.env.JWT_KEY,
                        { expiresInMinutes: 60, issuer: 'jwt_serv' }
                    );
                    return { success: true, result: 'success', user: response.user, jwt: token };
                });
        },

        get: function(name) {
            return this[name] || function() { return Promise.reject(`Unknown response result ${response.result}`) }
        }
    };

    return {
        koa: function() { return require('./seneca-auth-koa')(seneca); }
    };
};

module.exports.koa = function(seneca) { return require('./seneca-auth-koa')(seneca); };
