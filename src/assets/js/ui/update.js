ipcRenderer.on('update-not-available', async (event, data) => {
	$('#update').off().hide();
	console.dir(data);
});

ipcRenderer.on('update-ready', async (event, data) => {
	log.log(2, '[Update] Available! version: ' + data.version);
	log.dir(3, data);

	$('.tablinks[data-tabid="update"]').show();

	$('#version').text(`Version ${data.version}`);
	$('#size').text(getReadableFileSizeString(data.files[0].size));

	$('#update').one("click", () => ipcRenderer.send('update-install'));
});

ipcRenderer.on('update-progress', async (event, data) => log.dir(3, data));
