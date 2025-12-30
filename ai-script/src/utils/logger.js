const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    
    this.currentLevel = this.logLevels[config.logging.level] || this.logLevels.info;
    
    // Ensure log directory exists
    if (config.logging.logToFile) {
      if (!fs.existsSync(config.logging.logDir)) {
        fs.mkdirSync(config.logging.logDir, { recursive: true });
      }
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(config.logging.logDir, `ai-script-${date}.log`);
  }

  writeToFile(level, message) {
    if (config.logging.logToFile) {
      const logEntry = `[${this.getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
      fs.appendFileSync(this.getLogFile(), logEntry, 'utf8');
    }
  }

  log(level, message, data = null) {
    if (this.logLevels[level] <= this.currentLevel) {
      const timestamp = this.getTimestamp();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      // Console output with colors
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[90m', // Gray
        reset: '\x1b[0m',  // Reset
      };
      
      console.log(`${colors[level]}${logMessage}${colors.reset}`);
      
      if (data) {
        console.log('  Data:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
      }
      
      // Write to file
      this.writeToFile(level, message);
      if (data) {
        this.writeToFile(level, `Data: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
      }
    }
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }

  section(title) {
    console.log('\n' + '='.repeat(60));
    console.log(` ${title}`);
    console.log('='.repeat(60) + '\n');
  }
}

module.exports = new Logger();