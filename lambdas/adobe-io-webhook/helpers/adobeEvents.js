const sdk = require('@adobe/aio-lib-events')
const auth = require('@adobe/jwt-auth')

// Leverage Some of Adobe SDK with Viasat Overrides to avoid cache logic
const helpers = require('@adobe/aio-lib-events/src/helpers.js').exportFunctions
const signatureUtils = require('../adobe_sdk/signatureUtils.js').exportFunctions

const fs = require('fs')
const fetch = require('node-fetch')

async function initAdobeSdkClient () {
    // get an access token
    const accessToken = await getAccessToken();

    const sdkClient = await sdk.init(process.env.ORGANIZATION_ID, process.env.CLIENT_ID, accessToken);

    return sdkClient;
}

async function verifyDigitalSignatureForEvent (requestPayload, recipientClientId, signatureOptions) {
    const requestPayloadData = requestPayload.data.toString()

    console.log(`requestPayloadData: ${requestPayloadData}`)

    // check event payload and get proper payload used in I/O Events signing
    const rawSignedPayload = helpers.getProperPayload(requestPayloadData)

    // check if the target recipient is present in event and is a valid one, then verify the signature else return error
    const parsedJsonPayload = JSON.parse(rawSignedPayload)

    console.log(`parsedJsonPayload: ${JSON.stringify(parsedJsonPayload)}`)

    if (!signatureUtils.isTargetRecipient(parsedJsonPayload, recipientClientId)) {
      const message = 'Unable to authenticate, not a valid target recipient'
      return helpers.genErrorResponse(401, message)
    }

    console.log('valid target recipient')

    const digitalSignatureResult = await signatureUtils.verifyDigitalSignature(signatureOptions, recipientClientId, rawSignedPayload)
    console.log(`digitalSignatureResult: ${digitalSignatureResult}`)

    if (!digitalSignatureResult) {
        return false;
    }

    return parsedJsonPayload
}

async function getAccessToken () {
    const config = {
        clientId: process.env.CLIENT_ID,
        technicalAccountId: process.env.TECHNICAL_ACCOUNT_ID,
        orgId: process.env.ORGANIZATION_ID,
        clientSecret: process.env.CLIENT_SECRET,
        metaScopes: [ 'ent_cloudmgr_sdk' ]
    };

    config.privateKey = fs.readFileSync('.data/private.key');

    const { access_token } = await auth(config);

    return access_token;
}

async function makeApiCall (accessToken, url, method) {
    const apiResponse = await fetch(url, {
        'method': method,
        'headers': {
            'x-gw-ims-org-id': process.env.ORGANIZATION_ID,
            'x-api-key': process.env.CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return apiResponse.ok && apiResponse.json();
}

const exportFunctions = {
  initAdobeSdkClient,
  verifyDigitalSignatureForEvent,
  getAccessToken,
  makeApiCall
}

module.exports = {
  exportFunctions
}
