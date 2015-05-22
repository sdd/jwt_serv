'use strict';
var seneca = require('seneca')();

var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var conf = {
	key    : "PKqK8i6Ll1F75PqtU6iHBBgSi",
	secret : "o2gHCDIBhK6qCf54l88wBCKuocpa7FpMLqfVopljOOGCokC3Hj",
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

seneca.add({ auth: 'authenticate' }, authenticate);
