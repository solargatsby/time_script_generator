const log4js = require('log4js')
log4js.configure({
  appenders: {
    time_script_gen: { type: 'file', filename: 'time_script_generator.log' },
    console: { type: 'console'}
  },
  categories: { default: {appenders: ['console', 'time_script_gen'], level: 'info'}}
})

const logger = log4js.getLogger('time_script_gen')

module.exports = {
  logger,
}
