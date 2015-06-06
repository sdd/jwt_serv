"use strict";

var https = require('https');
var pem = require('pem');
var fs = require('fs');

module.exports = function(callback, config) {
    try {
        var privateKey = fs.readFileSync(config.ssl.privateKeyFile).toString();
        var certificate = fs.readFileSync(config.ssl.certificateFile).toString();

        pem.readCertificateInfo(certificate, function(err, data) {
            if (err) throw new Error('Could not read certificagte Info.');
            if (data.validity.end < Date.now()) throw new Error('Certificate expired.');

            console.log('Existing SSL cert valid.');
            https.createServer({key: privateKey, cert: certificate}, callback).listen(config.port);
            console.log(`HTTPS listening on port ${config.port}`);
        });

    } catch(e) {
        console.log('Regenerating SSL cert...');
        pem.createCertificate(
            { days:config.ssl.days, selfSigned:true },
            function(err, keys) {
                fs.writeFileSync('privatekey.pem', keys.serviceKey);
                fs.writeFileSync('certificate.pem', keys.certificate);

                https.createServer({key: keys.serviceKey, cert: keys.certificate}, callback).listen(config.port);
                console.log(`HTTPS listening on port ${config.port}`);
            }
        );
    };
}
