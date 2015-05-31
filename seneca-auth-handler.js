'use strict';

var _ = require('lodash');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var jwt = require('jsonwebtoken');

var conf = {
    key    : process.env.TWITTER_KEY,
    secret : process.env.TWITTER_SECRET,
    urlhost: "http://localhost:3018"
};

passport.use('twitter', new TwitterStrategy({
        consumerKey   : conf.key,
        consumerSecret: conf.secret,
        callbackURL   : conf.urlhost + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
        var data = {
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
    var params = {
        session: ['request_token', 'oauth_token_secret'],
        query  : ['oauth_token', 'oauth_verifier']
    };
    session['oauth:' + args.strategy] = _.pick(args, params.session);

    return {
        session: session,
        query  : _.pick(args, params.query)
    }
};

module.exports = function(seneca_instance) {
    var seneca = seneca_instance || require('seneca')();

    seneca.add({auth: 'authenticate'}, function (args, done) {
        var auth = passport.authenticate(args.strategy);

        var session = {};

        auth(mapArgsToAuth(args, session))
            .then(function (result) {
                result.oauth_token_secret = _.get(session, `['oauth:${args.strategy}'].oauth_token_secret`);

                done(null, result);
            });
    });
}
