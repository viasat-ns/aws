const adobeEvents = require('./adobeEvents.js').exportFunctions
const { URL } = require('url')

const slack = require('./slack.js').exportFunctions

// Adobe Event URLS
const PIPELINE_STARTED = 'https://ns.adobe.com/experience/cloudmanager/event/started'
const PIPELINE_ENDED = 'https://ns.adobe.com/experience/cloudmanager/event/ended'
const PIPELINE_EXECUTION = 'https://ns.adobe.com/experience/cloudmanager/pipeline-execution'

const STEP_STARTED = 'https://ns.adobe.com/experience/cloudmanager/event/started'
const STEP_ENDED = 'https://ns.adobe.com/experience/cloudmanager/event/ended'
const STEP_EXECUTION = 'https://ns.adobe.com/experience/cloudmanager/execution-step-state'

function handleAdobeChallange(challengeParam) {
    console.log( "Received adobe-io challenge: " + challengeParam);

    let responseBody = {
        challenge: challengeParam,
        lambdaVersion: process.env.APP_VERSION
    }

    const response = {
        status: 200,
        headers: { "content-type": [ { "key": "Content-Type", "value": "application/json" } ] },
        body: JSON.stringify(responseBody),
    };

    return response;
}

async function handleAdobePost(event) {
    const { request } = event.Records[0].cf;
    const requestPayload = request.body;

    console.log(`Received adobe-io post event: ${JSON.stringify(requestPayload)}`);

    const digitalSignature1 = request.headers['x-adobe-digital-signature-1'][0].value
    const digitalSignature2 = request.headers['x-adobe-digital-signature-2'][0].value
    const publicKeyPath1 = request.headers['x-adobe-public-key1-path'][0].value
    const publicKeyPath2 = request.headers['x-adobe-public-key2-path'][0].value

    console.log(digitalSignature1);
    console.log(digitalSignature2);
    console.log(publicKeyPath1);
    console.log(publicKeyPath2);

    const config = {
        digiSignature1: digitalSignature1,
        digiSignature2: digitalSignature2,
        publicKeyPath1: publicKeyPath1,
        publicKeyPath2: publicKeyPath2,
    };

    const adobeEvent = await adobeEvents.verifyDigitalSignatureForEvent(requestPayload, process.env.CLIENT_ID, config);

    console.log(`verified adobeEvent: ${adobeEvent}`)

    if (!adobeEvent) {
       throw new Error('Request not verified');
    }

    console.log(`verified adobeEvent: ${JSON.stringify(adobeEvent)}`)

    handleAdobeEvent(adobeEvent['event'])
}

function handleAdobeEvent (event) {
  // Get the identifying URL out of the event
  const identifierUrl = event['activitystreams:object']['@id']

  // Handle Execution Events
  if (PIPELINE_STARTED === event['@type'] && PIPELINE_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchExecutionData(identifierUrl).then(execution => {
      let message = `[${execution.pipeline.name}] - [Execution] - Started`
      console.log(message)
      slack.notify(message)
    })
  }

  if (PIPELINE_ENDED === event['@type'] && PIPELINE_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchExecutionData(identifierUrl).then(execution => {
      let message = `[${execution.pipeline.name}] - [Execution] - Ended with [Status: ${execution.status}]`
      console.log(message)
      slack.notify(message)
    })
  }

  // Handle Steps Events
  if (STEP_STARTED === event['@type'] && STEP_EXECUTION === event['xdmEventEnvelope:objectType']) {

    fetchStepStateData(identifierUrl).then(stepState => {
      let message = `[${stepState.pipeline.name}] - [Step: ${stepState.action}] - Started`
      console.log(message)
      slack.notify(message)
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
      slack.notify(message)
    })

  }
}

async function fetchExecutionData (identifierUrl) {
  const accessToken = await adobeEvents.getAccessToken()

  const execution = await adobeEvents.makeApiCall(accessToken, identifierUrl, 'GET')

  // secondary call to get the program data
  const programURL = new URL( getLink(execution, 'http://ns.adobe.com/adobecloud/rel/program'), identifierUrl)
  const program = await adobeEvents.makeApiCall(accessToken, programURL, 'GET')
  execution.program = program

  // secondary call to get the pipeline data
  const pipelineURL = new URL( getLink(execution, 'http://ns.adobe.com/adobecloud/rel/pipeline'), identifierUrl)
  const pipeline = await adobeEvents.makeApiCall(accessToken, pipelineURL, 'GET')
  execution.pipeline = pipeline

  return execution
}

async function fetchStepStateData (identifierUrl) {
  const accessToken = await adobeEvents.getAccessToken()

  const stepState = await adobeEvents.makeApiCall(accessToken, identifierUrl, 'GET')

  // secondary call to get the pipeline data
  const pipelineURL = new URL( getLink(stepState, 'http://ns.adobe.com/adobecloud/rel/pipeline'), identifierUrl)
  const pipeline = await adobeEvents.makeApiCall(accessToken, pipelineURL, 'GET')
  stepState.pipeline = pipeline

  return stepState
}

function getLink (obj, linkType) {
  return obj['_links'][linkType].href;
}

const exportFunctions = {
  handleAdobeChallange,
  handleAdobePost
}

module.exports = {
  exportFunctions
}
