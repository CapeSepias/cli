const { Buffer } = require('buffer')

const lambdaLocal = require('lambda-local')

const { NETLIFYDEVERR } = require('../../utils/logo')

const { detectAwsSdkError, DEFAULT_LAMBDA_OPTIONS, SECONDS_TO_MILLISECONDS } = require('./utils')

const createSynchronousFunctionCallback = function ({ response, warn }) {
  return function callbackHandler(err, lambdaResponse) {
    if (err) {
      return handleErr({ error: err, response, warn })
    }

    const { error } = validateLambdaResponse(lambdaResponse)
    if (error) {
      console.log(`${NETLIFYDEVERR} ${error}`)
      return handleErr({ error, response, warn })
    }

    response.statusCode = lambdaResponse.statusCode
    for (const key in lambdaResponse.headers) {
      response.setHeader(key, lambdaResponse.headers[key])
    }
    for (const key in lambdaResponse.multiValueHeaders) {
      const items = lambdaResponse.multiValueHeaders[key]
      response.setHeader(key, items)
    }
    if (lambdaResponse.body) {
      response.write(lambdaResponse.isBase64Encoded ? Buffer.from(lambdaResponse.body, 'base64') : lambdaResponse.body)
    }
    response.end()
  }
}

const executeSynchronousFunction = ({ event, lambdaPath, timeout, clientContext, response, warn }) =>
  lambdaLocal.execute({
    ...DEFAULT_LAMBDA_OPTIONS,
    event,
    lambdaPath,
    clientContext,
    callback: createSynchronousFunctionCallback({ response, warn }),
    timeoutMs: timeout * SECONDS_TO_MILLISECONDS,
  })

const formatLambdaLocalError = (err) => `${err.errorType}: ${err.errorMessage}\n  ${err.stackTrace.join('\n  ')}`

const handleErr = function ({ error, response, warn }) {
  detectAwsSdkError({ error, warn })

  response.statusCode = 500
  const errorString = typeof error === 'string' ? error : formatLambdaLocalError(error)
  response.end(errorString)
}

const validateLambdaResponse = (lambdaResponse) => {
  if (lambdaResponse === undefined) {
    return { error: 'lambda response was undefined. check your function code again' }
  }
  if (!Number(lambdaResponse.statusCode)) {
    return {
      error: `Your function response must have a numerical statusCode. You gave: $ ${lambdaResponse.statusCode}`,
    }
  }
  if (lambdaResponse.body && typeof lambdaResponse.body !== 'string') {
    return { error: `Your function response must have a string body. You gave: ${lambdaResponse.body}` }
  }

  return {}
}

module.exports = { executeSynchronousFunction }