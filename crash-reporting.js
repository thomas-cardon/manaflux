const { init } = require('@sentry/electron');
init({ dsn: 'https://521785db4e5242119dd9a3820b87e83f@sentry.io/1264182', environment: process.argv[2] === '--dev' ? 'development' : 'production' });
