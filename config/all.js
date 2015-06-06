module.exports = {
	port: 3018,

	koa: {
		keys: ['secrets'],
	},

	jwt:{
		secret: process.env.JWT_KEY,
		cookiename: 'jwt',
		key: 'kwt'
	},

	ssl: {
		privateKeyFile: 'privatekey.pem',
		certificateKeyFile: 'certificate.pem',
		days: 7
	},

	auth: {
		twitter: {
			key   : process.env.TWITTER_KEY,
			secret: process.env.TWITTER_SECRET
		}
		,
		google : {
			clientID    : process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET
		}
		,
		common : {
			urlhost: "https://localhost:3018"
		},
		expiry: 60 // minutes
	}

}
