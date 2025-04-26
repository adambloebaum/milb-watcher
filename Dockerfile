FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code (this will include config.js and carriers.js if they exist)
COPY . .

# Create default config.js if it doesn't exist
RUN if [ ! -f config.js ]; then \
    echo "// Configuration for milb-watcher\nmodule.exports = {\n  // Player Config\n  PLAYER_ID: process.env.PLAYER_ID || 'PLAYER_ID_HERE',\n  PLAYER_NAME: process.env.PLAYER_NAME || 'Player Name',\n  TEAM_ID: process.env.TEAM_ID || 'TEAM_ID_HERE',\n  LEAGUE_LEVEL: process.env.LEAGUE_LEVEL || '14',\n  SMS_RECIPIENTS: process.env.SMS_RECIPIENTS ? JSON.parse(process.env.SMS_RECIPIENTS) : [],\n  EMAIL_CONFIG: {\n    service: process.env.EMAIL_SERVICE || 'gmail',\n    auth: {\n      user: process.env.EMAIL_USER || '',\n      pass: process.env.EMAIL_PASS || ''\n    },\n    from: process.env.EMAIL_FROM || 'MiLB Watcher <>'\n  },\n  USE_SERVER_TIMEZONE: true,\n  CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000'),\n  STOP_AFTER_ENTRY: process.env.STOP_AFTER_ENTRY !== 'false',\n  CHECK_FOR_SCHEDULED_GAMES_ONLY: process.env.CHECK_FOR_SCHEDULED_GAMES_ONLY !== 'false'\n};" > config.js; \
    fi

# Create default carriers.js if it doesn't exist
RUN if [ ! -f carriers.js ]; then \
    echo "// Mobile carrier email-to-SMS gateway addresses\nconst carriers = {\n  att: 'txt.att.net',\n  tmobile: 'tmomail.net',\n  verizon: 'vtext.com',\n  sprint: 'messaging.sprintpcs.com',\n  cricket: 'sms.cricketwireless.net',\n  boost: 'sms.myboostmobile.com',\n  googlefi: 'msg.fi.google.com',\n  uscellular: 'email.uscc.net',\n  virgin: 'vmobl.com',\n  metro: 'mymetropcs.com',\n  xfinity: 'vtext.com',\n};\n\nfunction getEmailAddress(phoneNumber, carrier) {\n  const cleanPhone = phoneNumber.toString().replace(/\\D/g, '');\n  if (!carriers[carrier.toLowerCase()]) {\n    throw new Error(`Carrier '\${carrier}' is not supported. Supported carriers: \${Object.keys(carriers).join(', ')}`);\n  }\n  return `\${cleanPhone}@\${carriers[carrier.toLowerCase()]}`;\n}\n\nmodule.exports = {\n  getEmailAddress\n};" > carriers.js; \
    fi

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"] 