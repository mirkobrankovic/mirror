var winston = require('winston')

// set default log level.
var logLevel = 'info'

var logger = winston.createLogger({
    level: logLevel,
    levels: {
        fatal: 0,
        crit: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5
    },
    transports: [
        new (winston.transports.Console)({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new (winston.transports.File)({ filename: 'uploader.log' })
    ]
})

// Extend logger object to properly log 'Error' types
var origLog = logger.log

logger.log = function (level, msg) {
    if (msg instanceof Error) {
        var args = Array.prototype.slice.call(arguments)
        args[1] = msg.stack
        origLog.apply(logger, args)
    } else {
        origLog.apply(logger, arguments)
    }
}
/* LOGGER EXAMPLES
  var log = require('./log.js')
  log.trace('testing')
  log.debug('testing')
  log.info('testing')
  log.warn('testing')
  log.crit('testing')
  log.fatal('testing')
 */

module.exports = logger