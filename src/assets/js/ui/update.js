ipcRenderer.on('update-not-available', async (event, data) => {
	$('#update').off().hide();
	console.dir(data);
});

ipcRenderer.on('update-ready', async (event, data) => {
	log.log(2, '[Update] Available! version: ' + data.version);
	log.dir(3, data);

	$('.btn.tab[data-tabid="update"]').show();

	$('#version').text(`Version ${data.version}`);
	$('#updateRollout').text(i18n.__('update-staged-rollout', data.stagingPercentage + '%'));
	$('#updateSize').text(getReadableFileSizeString(data.files[0].size));

	$('#release-notes').text(markdown.toHTML(data.releaseNotes));

	$('#update').one("click", () => ipcRenderer.send('update-download'));
});

ipcRenderer.on('update-downloaded', async (event, data) => {
	UI.i18n($('button#update'), 'ui-menu-update');
});

ipcRenderer.on('update-progress', async (event, data) => log.dir(3, data));
