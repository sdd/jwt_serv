'use strict';

var TwitterStrategy = require('passport-twitter').Strategy;

module.exports = function(passport, conf) {
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
};
