const adobeEvents = require('../helpers/adobeEvents.js').exportFunctions

require('dotenv').config();

async function checkEnvironment () {

    const requestPayload = {
        "action": "read-only",
        "data": "eyJldmVudF9pZCI6ImQyN2NiYjNkLWNlMzMtNDIxMy1hYjg1LWFmNDEyOTY4ZTkzYiIsImV2ZW50Ijp7IkBpZCI6InVybjpvZWlkOmNsb3VkbWFuYWdlcjoxMDM0MmM5NC0yMWZmLTRhOTAtOGY3ZS1iN2NhYjc4YWFmM2EiLCJAdHlwZSI6Imh0dHBzOi8vbnMuYWRvYmUuY29tL2V4cGVyaWVuY2UvY2xvdWRtYW5hZ2VyL2V2ZW50L3N0YXJ0ZWQiLCJhY3Rpdml0eXN0cmVhbXM6cHVibGlzaGVkIjoiMjAyMi0wNi0wOFQwNDoxMDozNC4zMjZaIiwiYWN0aXZpdHlzdHJlYW1zOnRvIjp7IkB0eXBlIjoieGRtSW1zT3JnIiwieGRtSW1zT3JnOmlkIjoiMzcwNzY1RTQ1REU0RkY4RjBBNDk1Qzk0QEFkb2JlT3JnIn0sImFjdGl2aXR5c3RyZWFtczpvYmplY3QiOnsiQGlkIjoiaHR0cHM6Ly9jbG91ZG1hbmFnZXIuYWRvYmUuaW8vYXBpL3Byb2dyYW0vMTA4NTMvcGlwZWxpbmUvNDQwNjU3L2V4ZWN1dGlvbi8xNDA1ODA3L3BoYXNlLzI3Nzk3NTcvc3RlcC81MzQxNjAwIiwiQHR5cGUiOiJodHRwczovL25zLmFkb2JlLmNvbS9leHBlcmllbmNlL2Nsb3VkbWFuYWdlci9leGVjdXRpb24tc3RlcC1zdGF0ZSJ9LCJ4ZG1FdmVudEVudmVsb3BlOm9iamVjdFR5cGUiOiJodHRwczovL25zLmFkb2JlLmNvbS9leHBlcmllbmNlL2Nsb3VkbWFuYWdlci9leGVjdXRpb24tc3RlcC1zdGF0ZSJ9LCJyZWNpcGllbnRfY2xpZW50X2lkIjoiZWI4NjZlZDUxZTYxNGQ1NWI5MTEwOGM4NDc5ZGI2OTEifQ==",
        "encoding": "base64",
        "inputTruncated": false
    }

    const config = {
        digiSignature1: 'cxSaevN69UhJfCMJRAEq/UrGd8P47+3pkcjN6Plj04Q+Sk1J9/UNzEfm5/LFjDQABFaQ2PZoXELehL5322RPJu7hdqoQode+XI/1EquNoX9k6yr+DLH0rsOJ86XyFJ772F7zRDC6CbwAqzi5U7r5wz/Iw6gGT7Zi/HA2lNC7E5bYhKr9YIML1L3NEFtY1eOMzzEuV7jeLpohLiYYJHCtciINfakt603PtTZGyrF4nCOl1ZaWpfdOzDMDlzWxMX8eH2Y/KCKqrAVDA8Y5uOrhBoIgFVCHVNNVQ84pG6qdDrJwZrpUX+QOOhiHhbZgM6DZtlaeUwsHcbi1eOGpf3cYiA==',
        digiSignature2: 'JEu64Cgptv9b+cz7jBPgXxXqDC4yOCN/4AC4EtiQseQYdmaybjd1FdE6rAiSHslAy1UHQpLfM/V+vwDn5BGsRan2lZVEcDSxfBkR9kqg/hQGjP+EwhDut5cugoBlpphSxVKiWwolM/zaCyOqz//FczovLbBSqb61OptOwGRCaITxyRzviRkgqQOzVpSPZSwms24uyJTtW4CCesaEwDg/RlWFYal+vqIwROdxvrhgU/6OQ/drgoHjAR3//50bt7aRYPMThy3Ndw6kd2BSryawP559o9h8lyITzHex7kY6Bfa4/yguwt8oyr8yiw7sw9i7YuH8ImOYscq3SrA4Cu7W0A==',
        publicKeyPath1: '/prod/keys/pub-key-0eVF88tU5Q.pem',
        publicKeyPath2: '/prod/keys/pub-key-G5-b10Yqum.pem'
    };

    const adobeEvent = await adobeEvents.verifyDigitalSignatureForEvent(requestPayload, process.env.CLIENT_ID, config);

    if (!adobeEvent) {
       throw new Error('Request not verified');
    }

    console.log(`verified adobeEvent: ${JSON.stringify(adobeEvent.event)}`)
    console.log(`activitystream id: ${adobeEvent.event['activitystreams:object']['@id']}`)
}

checkEnvironment()
    .then(() => console.log('success.'))
    .catch(err => console.error(err))
