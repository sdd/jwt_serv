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

module.exports = function(seneca_instance) {
    const seneca = seneca_instance || require('seneca')();

    seneca.add({system: 'auth', action: 'auth'}, function (args, done) {
        let auth = passport.authenticate(args.strategy);

        let session = {};

        auth(mapArgsToAuth(args, session))
            .then(function (response) {

                if (response.result === 'redirect') {
                    response.oauth_token_secret = _.get(session, `['oauth:${args.strategy}'].oauth_token_secret`);
                    done(null, response);

                } else if (response.result === 'success') {
                    seneca.actAsync({system: 'user', action: 'login', query: response})
                        .then(function (response) {

                            // create a JWT
                            var token = jwt.sign(
                                { user: { id: response.user.id, name: response.user.name } },
                                process.env.JWT_KEY,
                                {
                                    expiresInMinutes: 60,
                                    issuer: 'jwt_serv'
                                }
                            );

                            done(null, { success: true, result: 'success', user: response.user, jwt: token });
                        }).catch(done);

                } else {
                    done(response);
                }
            });
    });

    return seneca;
};
