const LeaguePlug = require('./');
const instance = new LeaguePlug();

console.log('Loading LeaguePlug');
instance.load().then(() => {
  instance.start();
  console.log('Started LeaguePlug');

  instance.getConnectionHandler().on('connected', d => console.log('connected', d));
  instance.getConnectionHandler().on('logged-in', d => console.log('logged-in', d));
  instance.getConnectionHandler().on('logged-off', () => console.log('logged-off'));
  instance.getConnectionHandler().on('disconnected', () => console.log('disconnected'));
});
