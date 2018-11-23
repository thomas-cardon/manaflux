const { crashReporter } = require('electron');

global.crashReporter = crashReporter;
crashReporter.start({
  productName: 'Manaflux',
  companyName: 'Ryzzzen/manaflux',
  submitURL: 'https://manaflux-server.herokuapp.com/api/app-crashes/manaflux',
  uploadToServer: true
});
