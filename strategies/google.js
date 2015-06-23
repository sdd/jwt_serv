'use strict';

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(passport, conf) {
	passport.use('google', new GoogleStrategy(
		{
			clientID        : conf.clientID,
			clientSecret    : conf.clientSecret,
			callbackURL     : conf.urlhost + '/auth/google/callback',
			scope           : 'profile email'
		},
		function(accessToken, refreshToken, profile, done) {
			let data = {
				nick        : profile.username,
				name        : profile.displayName,
				identifier  : '' + profile.id,
				credentials : { accessToken: accessToken, refreshToken: refreshToken },
				userdata    : profile,
				when        : new Date().toISOString()
			};
			done(null, data);
		}
	));
};
