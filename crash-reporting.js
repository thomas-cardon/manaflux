const { crashReporter } = require('electron');

crashReporter.start({
  productName: 'Manaflux',
  companyName: 'Ryzzzen/manaflux',
  submitURL: 'https://manaflux-server.herokuapp.com/api/app-crashes/manaflux',
  uploadToServer: true
});
