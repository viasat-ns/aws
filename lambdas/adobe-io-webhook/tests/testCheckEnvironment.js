
const auth = require('@adobe/jwt-auth')
const fs = require('fs')
const fetch = require('node-fetch')

require('dotenv').config()

async function getAccessToken () {
  const config = {
    clientId: process.env.CLIENT_ID,
    technicalAccountId: process.env.TECHNICAL_ACCOUNT_ID,
    orgId: process.env.ORGANIZATION_ID,
    clientSecret: process.env.CLIENT_SECRET,
    metaScopes: [ 'ent_cloudmgr_sdk' ]
  }
  config.privateKey = fs.readFileSync('.data/private.key')

  const { access_token } = await auth(config)
  return access_token  
}

async function makeApiCall (accessToken, url, method) {
  const response = await fetch(url, {
    'method': method,
    'headers': {
      'x-gw-ims-org-id': process.env.ORGANIZATION_ID,
      'x-api-key': process.env.CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return response.ok && response.json()
}

async function checkEnvironment () {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Could not obtain accessToken');
  } else {
    console.log(`obtained access token ${accessToken}`);

    const apiResponse = await makeApiCall(accessToken, 'https://cloudmanager.adobe.io/api/programs', 'GET');

    if (!apiResponse) {
      throw new Error('Failed to fetch programs')
    }

    console.log(`listed programs ${JSON.stringify(apiResponse._embedded.programs)}`)
  }
}

checkEnvironment()
    .then(() => console.log('success'))
    .catch(err => console.error(err))
