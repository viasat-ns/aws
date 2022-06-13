const fetch = require('node-fetch')

function notify(message) {
  fetch(process.env.SLACK_WEBHOOK, {
      'method': 'POST',
      'headers': { 'Content-Type': 'application/json' },
      'body': JSON.stringify({
      'text': `${message}`
    })
  })
}

const exportFunctions = {
  notify
}

module.exports = {
  exportFunctions
}
