
require('dotenv').config();

// Viasat modules
const utils = require('./helpers/utils.js').exportFunctions
const debug = require('./helpers/debug.js').exportFunctions
const adobeHandlers = require('./helpers/adobeHandlers.js').exportFunctions

exports.handler = async (event, context, callback) => {
    // get request object information
    const { request } = event.Records[0].cf;

    const url = request.uri;
    console.log(`URL: ${url}`);

    const reqType = request.method;

    // determine a handler to process the request and prepare a response
    if (reqType === "GET" && url === "/adobe-io") {
        console.log('adobe-io GET');

        // check for query params
        let challengeParam = utils.getQueryParam(request.querystring, "challenge");

        const response = adobeHandlers.handleAdobeChallange(challengeParam);

        return callback(null, response);
    }

    if (reqType === "POST" && url === "/adobe-io") {
        console.log('adobe-io POST');

        try {
            await adobeHandlers.handleAdobePost(event);

            const response = { status: 200, body: `lambdaVersion: ${process.env.APP_VERSION} - pong` };
            return callback(null, response);
        } catch (error) {
            console.error(`adobe-io POST error: ${error}`);

            const response = { status: 403, body: `lambdaVersion: ${process.env.APP_VERSION} - Not Authorized` };
            return callback(null, response);
        }
    }

    if (reqType === "GET" && url === "/check") {
        try {
            debug.checkEnvironment();

            const response = { status: 200, body: `lambdaVersion: ${process.env.APP_VERSION} - Adobe IO Connection Healthy` };
            return callback(null, response);
        } catch (error) {
            console.error(`check error: ${error}`);

            const response = { status: 503, body: `lambdaVersion: ${process.env.APP_VERSION} - Adobe IO Connection Unhealthy - ${error}` };
            return callback(null, response);
        }
    }

    if (reqType === "GET" && url === "/debug") {
        const response = debug.handleDebug(event);

        return callback(null, response);
    }

    // return a default response if not handled above
    const response = { status: 503, body: `lambdaVersion: ${process.env.APP_VERSION} - Default Response Handler` };

    return callback(null, response);
};
