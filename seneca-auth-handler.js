'use strict';

var _ = require('lodash');
var seneca = require('seneca')();
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var conf = {
    key    : process.env.TWITTER_KEY,
    secret : process.env.TWITTER_SECRET,
    urlhost: "http://advansb.uk.dev:3018"
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

seneca.add({ auth: 'authenticate' }, function(args, done) {
    var auth = passport.authenticate(args.strategy);

    var params = {
        session: ['request_token', 'oauth_token_secret'],
        query: ['oauth_token', 'verify_token']
    };

    var session = {};
    session['oauth:' + args.strategy] = _.pick(args, params.session);

    auth({ session: session, query: _.pick(args, params.query) })
        .then(function(result) {
            done(null, result);
        });
});
