ipcRenderer.on('update-not-available', async (event, data) => {
	$('#update').off().hide();
	console.dir(data);
});

ipcRenderer.on('update-available', async (event, data) => {
	log.dir(3, data);

	log.log(2, '[Update] Available! version: ' + data.version);
	$('.btn.tab[data-tabid="update"]').show();

	$('#version').text(`Version ${data.version}`);
	$('#updateRollout').text(i18n.__('update-staged-rollout', (data.stagingPercentage || 100) + '%'));
	$('#updateSize').text(getReadableFileSizeString(data.files[0].size));

	let text = '', changelogs = {};

	for (const note of data.releaseNotes) {
		if (!changelogs[note.version]) changelogs[note.version] = '';
		changelogs[note.version] += note.note.replace('h2', 'h4').replace('h1', 'h3') + '<br>';
	}

	for (const [version, notes] of Object.entries(changelogs)) {
		text += '<h2>V' + version + '</h2>';
		text += notes;
	}

	console.dir(changelogs);

	$('#release-notes').append(text);

	$('#update').one("click", () => ipcRenderer.send('update-download'));
});

ipcRenderer.on('update-downloaded', async (event, data) => {
	UI.i18n($('button#update'), 'ui-menu-update');
	console.dir(data);
});

ipcRenderer.on('update-progress', async (event, data) => log.dir(3, data));
