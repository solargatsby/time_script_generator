const http = require('http')
const {HTTP_SERVER_PORT} = require('../utils/config')
const {getCurrentTimeInfo} = require('../time_script/update')
const {logger} = require('../utils/log')

const HTTP_GET_TIMESTAMP_URL = '/get_timestamp'

const startHttpSvr = () => {
  if (HTTP_SERVER_PORT == 0){
    return
  }
  const server = http.createServer()
  server.on('request', async function (request, response) {
    if (request.url === HTTP_GET_TIMESTAMP_URL) {
      const curTimeInfo = await getCurrentTimeInfo()
      if (!curTimeInfo) {
        response.write('Time info cell haven\'t create yet')
      } else {
        response.write(curTimeInfo.getTimestamp().toString())
      }
    }
    response.end()
  })
  server.listen(HTTP_SERVER_PORT, function () {
    logger.info(`HttpServer start at http://127.0.0.1:${HTTP_SERVER_PORT}`)
  })
}

module.exports = {
  startHttpSvr,
}
