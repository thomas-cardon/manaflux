const LeaguePlug = require('./');
const instance = new LeaguePlug();

instance.load().then(() => {
  instance.start();
  instance.getConnectionHandler().on('connected', d => console.log('connected'));
  instance.getConnectionHandler().on('logged-in', () => console.log('logged-in'));
  instance.getConnectionHandler().on('logged-off', () => console.log('logged-off'));
  instance.getConnectionHandler().on('disconnected', () => console.log('disconnected'));
});
