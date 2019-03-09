const { crashReporter } = require('electron');

crashReporter.start({
  productName: 'Manaflux',
  companyName: 'Ryzzzen/manaflux',
  submitURL: 'http://localhost:8920/api/app-crashes/v1/manaflux',
  uploadToServer: true
});

/* Client-only method */
if (!process || typeof process === 'undefined' || !process.type || process.type === 'renderer') {
  ipcRenderer.on('lcu-logged-in', data => {
    if (!data) return;
    console.log('Crash Reporter >> Restarted because user logged in');

    crashReporter.start({
      productName: 'Manaflux',
      companyName: 'Ryzzzen/manaflux',
      submitURL: 'http://localhost:8920/api/app-crashes/v1/manaflux',
      uploadToServer: true,
      extra: {
        summonerId: data.summonerId,
        summonerName: data.displayName
      }
    });
  });
}
