const adobeEvents = require('./adobeEvents.js').exportFunctions

function handleDebug(event) {
    let responseBody = {
        message: 'Default Response Handler',
        lambdaVersion: process.env.APP_VERSION,
        input: event
    }

    const response = {
        status: 200,
        body: JSON.stringify(responseBody),
    };

    return response;
}

async function checkEnvironment () {
    const accessToken = await adobeEvents.getAccessToken();

    if (!accessToken) {
        throw new Error('Could not obtain accessToken');
    }

    console.log(`obtained access token ${accessToken}`);

    const apiResponse = await adobeEvents.makeApiCall(accessToken, 'https://cloudmanager.adobe.io/api/programs', 'GET');

    if (!apiResponse) {
        throw new Error('Could not list programs');
    }

    console.log(`listed programs ${JSON.stringify(apiResponse._embedded.programs)}`)

    console.log("checkEnvironment: complete");
}

const exportFunctions = {
  handleDebug,
  checkEnvironment
}

module.exports = {
  exportFunctions
}
