'use strict';

const path = require('path')
const redirects = require('./redirects.json');

exports.handler = (event, context, callback) => {
        //get request object
    const { request } = event.Records[0].cf

    const url = request.uri;

    
    for (let redirect of redirects) {
        if( url.search( (redirect.regex) ) >= 0 ) {
            const redirect_cb = {
                status: '301',
                statusDescription: 'Moved Permanently',
                headers: {
                    "x-viasat-fwd": [{
                        key: 'X-Viasat-FWD',
                        value: "order-redirect-lookup",
                    }],
                    location: [{
                        key: 'Location',
                        value: redirect.to,
                    }],
                },
            };
            return callback(null, redirect_cb);
        }
    }

    
    //create HTTP redirect...
    const redirect = {
        status: '301',
        statusDescription: 'Moved Permanently',
        headers: {
            location: [{
                key: 'Location',
                value: 'https://buy.viasat.com/',
            }],
            "x-viasat-fwd": [{
                key: 'X-Viasat-FWD',
                value: "order-default",
            }]
        },
    };
    
    return callback(null, redirect);
};
