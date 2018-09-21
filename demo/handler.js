const IOpipe = require('@iopipe/iopipe')
const tracePlugin = require('@iopipe/trace')
const color = require('color')
const mqtt = require('mqtt')

const iopipe = IOpipe({
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImF1dGgwfDU4MTA4ZWU4MDA0NDE0YWU2NzkxMzMyZCIsInVzZXJuYW1lIjoiaW9waXBlX2RlbW8iLCJpYXQiOjE0Nzc0ODAxOTcsImF1ZCI6Imh0dHBzOi8vbWV0cmljcy1hcGkuaW9waXBlLmNvbS9ldmVudC8ifQ.rqy-hDI5x_nSJaQiVUviX5YH6OhzR7HMEQG79d_OuRw',
  plugins: [tracePlugin()]
})

module.exports.sendColor = iopipe(function (event, context) {
  if(!event.queryStringParameters) {
    context.succeed('Requires URL parameter `color`!')
    context.iopipe.label('no-color-parameter')
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Requires URL parameter `color`!',
        input: event,
      }),
    }
  }
  let sentColor
  
  try {
    sentColor = color(event.queryStringParameters["color"])
  } catch(err) {
    context.iopipe.label('invalid-color')
    context.succeed('Invalid color!')
  }

  if(sentColor) {
    context.iopipe.mark.start('adafruitio-connect')
    let client = mqtt.connect('mqtt://io.adafruit.com', {
      port: 1883,
      username: 'nodebotanist',
      password: 'fd534215bd474bbdb5c16e1176f4bcd7'
    })

    client.on('connect', () => {
      context.iopipe.mark.end('adafruitio-connect')
      client.subscribe('nodebotanist/feeds/colorbot', () => {
        client.publish('nodebotanist/feeds/colorbot', sentColor.red() + ',' + sentColor.green() + ',' + sentColor.blue())
      })

      context.succeed('Color sent.')
    })  

    client.on('error', (err) => {
      context.iopipe.mark.end('adafruitio-connect')
      context.iopipe.label('adafruitio-connect-error')
      context.succeed(err)
    })

  } else {
    context.iopipe.label('invalid-color')
    context.succeed('Invalid color!')
  }
})
