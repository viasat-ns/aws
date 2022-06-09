const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const jsrsasign = require('jsrsasign')
const fetch = require('node-fetch')

const { URLSearchParams, URL } = require('url')

require('dotenv').config()

// #################################### functions for Adobe Events ####################################

async function getAccessToken () {
  const EXPIRATION = 60 * 60 // 1 hour

  const header = {
    'alg': 'RS256',
    'typ': 'JWT'
  }

  const payload = {
    'exp': Math.round(new Date().getTime() / 1000) + EXPIRATION,
    'iss': process.env.ORGANIZATION_ID,
    'sub': process.env.TECHNICAL_ACCOUNT_ID,
    'aud': `https://ims-na1.adobelogin.com/c/${process.env.API_KEY}`,
    'https://ims-na1.adobelogin.com/s/ent_cloudmgr_sdk': true
  }

  const jwtToken = jsrsasign.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), process.env.PRIVATE_KEY)

  const response = await fetch('https://ims-na1.adobelogin.com/ims/exchange/jwt', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.API_KEY,
      client_secret: process.env.CLIENT_SECRET,
      jwt_token: jwtToken
    })
  })

  const json = await response.json()

  return json['access_token']
}

async function makeApiCall (accessToken, url, method) {
  const response = await fetch(url, {
    'method': method,
    'headers': {
      'x-gw-ims-org-id': process.env.ORGANIZATION_ID,
      'x-api-key': process.env.API_KEY,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return response.json()
}

function getLink (obj, linkType) {
  return obj['_links'][linkType].href
}

async function fetchExecutionData (identifierUrl) {
  const accessToken = await getAccessToken()

  const execution = await makeApiCall(accessToken, identifierUrl, 'GET')

  // secondary call to get the program data
  const programURL = new URL( getLink(execution, 'http://ns.adobe.com/adobecloud/rel/program'), identifierUrl)
  const program = await makeApiCall(accessToken, programURL, 'GET')
  execution.program = program

  // secondary call to get the pipeline data
  const pipelineURL = new URL( getLink(execution, 'http://ns.adobe.com/adobecloud/rel/pipeline'), identifierUrl)
  const pipeline = await makeApiCall(accessToken, pipelineURL, 'GET')
  execution.pipeline = pipeline

  return execution
}

async function fetchStepStateData (identifierUrl) {
  const accessToken = await getAccessToken()

  const stepState = await makeApiCall(accessToken, identifierUrl, 'GET')

  // secondary call to get the pipeline data
  const pipelineURL = new URL( getLink(stepState, 'http://ns.adobe.com/adobecloud/rel/pipeline'), identifierUrl)
  const pipeline = await makeApiCall(accessToken, pipelineURL, 'GET')
  stepState.pipeline = pipeline

  return stepState
}

// #################################### functions for Slack Integration ####################################

function notifySlack (message) {
  fetch(process.env.SLACK_WEBHOOK, {
    'method': 'POST',
    'headers': { 'Content-Type': 'application/json' },
    'body': JSON.stringify({
      'text': message
    })
  })
}

// #################################### functions for Express Route Handlers ####################################

const app = express()

// HMAC signature validation (Deprecated 06/08/2022)

app.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    const signature = req.header('x-adobe-signature')
    if (signature) {
      const hmac = crypto.createHmac('sha256', process.env.CLIENT_SECRET)
      hmac.update(buf)
      const digest = hmac.digest('base64')

      if (signature !== digest) {
        throw new Error('x-adobe-signature HMAC check failed')
      }
    } else if (!process.env.DEBUG && req.method === 'POST') {
      throw new Error('x-adobe-signature required')
    }
  }
}))

// GET request handler for Adobe IO challange

app.get('/webhook', (req, res) => {
  if (req.query['challenge']) {
    res.send(req.query['challenge'])
  } else {
    console.log('No challenge')
    res.status(400)
  }
})

// POST request handler for Adobe IO Event

app.post('/webhook', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/text' })
  res.end('pong')

  const PIPELINE_STARTED = 'https://ns.adobe.com/experience/cloudmanager/event/started'
  const PIPELINE_ENDED = 'https://ns.adobe.com/experience/cloudmanager/event/ended'
  const PIPELINE_EXECUTION = 'https://ns.adobe.com/experience/cloudmanager/pipeline-execution'

  const STEP_STARTED = 'https://ns.adobe.com/experience/cloudmanager/event/started'
  const STEP_ENDED = 'https://ns.adobe.com/experience/cloudmanager/event/ended'
  const STEP_EXECUTION = 'https://ns.adobe.com/experience/cloudmanager/execution-step-state'

  const event = req.body.event

  // Get the identifying URL out of the event
  const identifierUrl = event['activitystreams:object']['@id']

  // Handle Execution Events
  if (PIPELINE_STARTED === event['@type'] && PIPELINE_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchExecutionData(identifierUrl).then(execution => {
      let message = `[${execution.pipeline.name}] - [Execution] - Started`
      console.log(message)
      notifySlack(message)
    })
  }

  if (PIPELINE_ENDED === event['@type'] && PIPELINE_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchExecutionData(identifierUrl).then(execution => {
      let message = `[${execution.pipeline.name}] - [Execution] - Ended with [Status: ${execution.status}]`
      console.log(message)
      notifySlack(message)
    })
  }

  // Handle Steps Events
  if (STEP_STARTED === event['@type'] && STEP_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchStepStateData(identifierUrl).then(stepState => {
      let message = `[${stepState.pipeline.name}] - [Step: ${stepState.action}] - Started`
      console.log(message)
      notifySlack(message)
    })
  }

  if (STEP_ENDED === event['@type'] && STEP_EXECUTION === event['xdmEventEnvelope:objectType']) {

	  fetchStepStateData(identifierUrl).then(stepState => {
      let message = `[${stepState.pipeline.name}] - [Step: ${stepState.action}] - Ended with [Status: ${stepState.status}]`

      // append detailed build information to the message
      if (stepState.action == 'build') {
      	if (typeof stepState.branch != undefined && typeof stepState.commitId != undefined) {
          let detailedBuildMessage = ` with build details - [branch: ${stepState.branch}] - [commitId: ${stepState.commitId}]`
          message = message + detailedBuildMessage
      	}
      }

      console.log(message)
      notifySlack(message)
    })

  }
})

// #################################### Express App listener ####################################

const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})