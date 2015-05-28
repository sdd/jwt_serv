'use strict';

var seneca = require('seneca')();
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var conf = {
    key    : process.env.TWITTER_KEY,
    secret : process.env.TWITTER_SECRET,
    urlhost: "http://advansb.uk.dev:3010"
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
    var auth = passport.authenticate('twitter');
    auth({ session: {}, query: {} })
        .then(function(result) { done(null, result); });
});

seneca.add({ auth: 'auth_redirect' }, function(args, done) {
    var auth = passport.authenticate('twitter');
    auth({ session: {}, query: { oauth_token: args.oauth_token } })
        .then(function(result) {
            done(null, result);
        });
});

seneca.act({ auth: 'authenticate' }, function(err, out) {
    if (err) console.error(err);
    console.log(JSON.stringify(out));
});

seneca.act({ auth: 'auth_redirect', oauth_token: '4LdWqNOnwLN1rRyUm5NEvbwmT0XAtP83' }, function(err, out) {
    if (err) console.error(err);
    console.log(JSON.stringify(out));
});
