var winston = require('winston');
const moment = require('moment');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
// set default log level.
var logLevel = 'info'

workDir = process.env.WORK_DIR || "/var/www/html/mirror/";

const newFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();

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
            format: format.combine(
                label({ label: 'uploader' }),
                timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                newFormat
            )
        }),
        new (winston.transports.File)({ 
            filename: `${workDir}/uploader.log`,
            format: format.combine(
                label({ label: 'uploader' }),
                timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                newFormat
            )
        })
    ]
})

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