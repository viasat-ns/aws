'use strict';
const path = require('path');
const { performance } = require('perf_hooks');
const redirects = require('./redirects.json');
const migrations = require('./aem-content-migrations.json');

exports.handler = (event, context, callback) => {
    //get request object
    const { request } = event.Records[0].cf;
    var url = request.uri;

    console.log("URL (11): " + url);

    //check for empth path
    if( url  === "") {
        console.log( "Callback (15): " + url);
        return callback(null, request);
    }

    console.log("URL (19): " + url);


    //exclude /bin/* per Nathan Sego 1/9/2021.
    if( url.search( ("^/bin/") ) >= 0 ){
        console.log( "Callback (24): " + url);
        return callback(null, request);
    }

    console.log("URL (28): " + url);

    var hostname = null;

    if( request.headers.host && request.headers.host[0] ) {
        hostname = request.headers.host[0].value;
    }

    console.log("URL (36): " + url);

    if( hostname == "energy-dev.web.viasat.com" ) {
        const redirect_cb = {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                "x-viasat-fwd": [{
                    key: 'X-Viasat-FWD',
                    value: "redirect-www",
                }],
                location: [{
                    key: 'Location',
                    value: ("https://dev.web.viasat.com/enterprise-and-mobility/energy-services/"),
                }],
            },
        };
        console.log( "301 (53): " + url);
        return callback(null, redirect_cb);
    }

    if( hostname !== "dev.web.viasat.com" ) {
        const redirect_cb = {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                "x-viasat-fwd": [{
                    key: 'X-Viasat-FWD',
                    value: "redirect-www",
                }],
                location: [{
                    key: 'Location',
                    value: ("https://dev.web.viasat.com" + url),
                }],
            },
        };
        console.log( "301 (53): " + url);
        return callback(null, redirect_cb);
    }

    //we need to determine if this request has an extension.
    const extension = path.extname(url);

    console.log("URL (60): " + url);

    // Remove /.html if added by AEM Ticket: WEBCON-3983
    if( url.endsWith( "/.html" ) ){
        url = url.replace( "/.html", "/" );
        request.uri = url;

        const redirect_ns = {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                location: [{
                    key: 'Location',
                    value: url,
                }],
                "x-viasat-fwd": [{
                    key: 'X-Viasat-FWD',
                    value: "/.html redirect",
                }]
            },
        };

        console.log( "301 (82): " + url );
        return callback(null, redirect_ns);

    }

    console.log("URL (87): " + url);

    //path.extname returns an empty string when there's no extension.
    //if there is an extension on this request, continue without doing anything!
    if(extension && extension.length > 0){
        console.log( "Callback (92): " + url);
        return callback(null, request);
    }

    console.log("URL (96): " + url);

    var startTime = performance.now();

    //check for migration definition
    for (let migration of migrations) {
        var regexpObj = new RegExp('^' + migration.regex + '/?$', 'i');
        var sourceMatches = url.match( regexpObj );

        var target = migration.to;

        if ( sourceMatches != null && sourceMatches.length >= 1 ) {

            var endTime = performance.now();

            for (var i = 1; i < sourceMatches.length; i++) {
                target = target.replace('$' + i, sourceMatches[i]);
            }

            var targetQueryString = '';

            if (typeof request.querystring != undefined && 'queryParamsRegex' in migration) {
                var querystringRegexObj = new RegExp('^' + migration.queryParamsRegex + '$', 'i');
                var sourceQueryStringMatches = request.querystring.match(querystringRegexObj);

                if ( sourceQueryStringMatches != null && sourceQueryStringMatches.length >= 1 ) {
                    targetQueryString = sourceQueryStringMatches[1];
                    target = target + '?' + targetQueryString;
                }
            }

            const redirect_cb = {
                status: '301',
                statusDescription: 'Moved Permanently',
                headers: {
                    "x-viasat-fwd": [{
                        key: 'X-Viasat-FWD',
                        value: "migration-lookup",
                    }],
                    location: [{
                        key: 'Location',
                        value: target,
                    }],
                },
            };
            console.log( "301 (152): " + target);
            return callback(null, redirect_cb);
        }
    }

    //check for redirect definition
    for (let redirect of redirects) {
        var regexpObj = new RegExp('^' + redirect.regex + '/?$', "i");
        if( url.search( regexpObj ) >= 0 ) {

            var endTime = performance.now();

            const redirect_cb = {
                status: '301',
                statusDescription: 'Moved Permanently',
                headers: {
                    "x-viasat-fwd": [{
                        key: 'X-Viasat-FWD',
                        value: "redirect-lookup",
                    }],
                    location: [{
                        key: 'Location',
                        value: redirect.to,
                    }],
                },
            };
            console.log( "301 (120): " + url);
            return callback(null, redirect_cb);
        }
    }

    var endTime = performance.now();
    console.log(`Time file ${endTime - startTime} milliseconds`);

    //let's check if the last character is a slash.
    const last_character = url.slice(-1);

    console.log("URL (130): " + url);

    //if there is already a trailing slash, return.
    if(last_character === "/"){
        console.log( "Callback (134): " + url);
        return callback(null, request);
    }

    console.log("URL (138): " + url);

    //add a trailing slash.    
    var new_url = `${url}/`;

    console.log("URL (143): " + url);
    console.log("New URL (144): " + new_url);

    //appending query string if present  
    const qs = request.querystring;

    if(qs && qs.length > 0){
        new_url += `?${qs}`;
    }

    console.log("URL (153): " + url);
    console.log("New URL (154): " + new_url);

    //create HTTP redirect...
    const redirect = {
        status: '301',
        statusDescription: 'Moved Permanently',
        headers: {
            location: [{
                key: 'Location',
                value: 'https://dev.web.viasat.com' + new_url,
            }],
            "x-viasat-fwd": [{
                key: 'X-Viasat-FWD',
                value: "no-slash",
            }]
        },
    };
    console.log("URL (171): " + url);
    console.log("New URL (1): " + new_url);

    return callback(null, redirect);
};