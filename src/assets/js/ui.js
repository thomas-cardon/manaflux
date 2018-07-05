var UI = {};

UI.error = function(err) {
	$('#warning').show();
	alertify.notify(err instanceof Error ? err.toString() : err, 'error', 10, () => $('#warning').hide());
}

UI.tray = function(tray = true) {
	console.log(`${tray ? 'Enabling' : 'Disabling'} Tray Mode.`);

	if (tray) {
		ipcRenderer.send('win-hide');
		ipcRenderer.send('tray', true);
	}
	else {
		ipcRenderer.send('tray', false);
		ipcRenderer.send('win-show', true);
	}
}


window.onbeforeunload = (e) => UI.tray(false);
ipcRenderer.on('error', (event, data) => UI.error(data));

/*
* Manual Button Handler
*/

$.fn.enableManualButton = function(cb, off) {
	if (off) $(this).off();
	$(this).show().click(cb);
	return this;
}

$.fn.disableManualButton = function() {
	$(this).off().hide();
	return this;
}

/*
* Hextech Animation Handler
*/
UI.enableHextechAnimation = function(championKey, primaryStyleId) {
	if (championKey === 'FiddleSticks') championKey = 'Fiddlesticks';

	$('.championPortrait > #bg').attr('src', 'assets/img/vfx-' + (primaryStyleId ? primaryStyleId : 'white') + '.png');
	$('.championPortrait > #champion')
	.attr('src', championKey ? ('https://ddragon.leagueoflegends.com/cdn/8.3.1/img/champion/' + championKey + '.png') : 'assets/img/-1.png')
	.on('load', () => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
}

UI.disableHextechAnimation = () => {
	$('.championPortrait').hide();
	$(".title").animate({ "margin-top": "0%" }, 700, "linear");
}

/*
* Tab Handler
*/
$(document).ready(function() {
	$('.tablinks').click(function() {
		const content = $(`.tabcontent[data-tabid="${$(this).data('tabid')}"]`);
		document.getElementById("selected").style.marginLeft = $(this).data('tabid') !== 'home' ? (89 + $(this).position().left) : 89 + 'px';

		$('.tabcontent').hide();
		content.show();

		$('.tablinks').removeClass('active');
		$(this).addClass('active');
	});
});

/*
* Settings
*/
Mana.once('settings', store => {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + Mana.store.get('theme') + "')");
	$(':checkbox[data-settings-key]').each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).prop('checked', store.get($(this).data('settings-key')));

		$(this).prop('id', $(this).data('settings-key'));
		$(this).siblings('label').prop('for', $(this).data('settings-key'));
	});

	$('select[data-settings-key]').each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).val(store.get($(this).data('settings-key')));
	});
});

$(':checkbox[data-settings-key]').change(function() {
	console.log(`Changing value of ${$(this).data('settings-key')} to: ${$(this).is(":checked")}`);
	Mana.store.set($(this).data('settings-key'), $(this).is(":checked"));
});

$('select[data-settings-key]').change(function() {
	console.log(`Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
	Mana.store.set($(this).data('settings-key'), this.value);
});

$('select[data-settings-key=theme]').change(function() {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + this.value + "')");
})

ipcRenderer.once('update-ready', async (event, data) => {
	console.log('Update available ! version: ' + data.version);
	console.dir(data);

	$('.tablinks[data-tabid="update"]').show();

	$('#version').text(`Version ${data.version}`);
	$('#size').text(getReadableFileSizeString(data.files[0].size));

	$('#releasenotes').text(jQuery(data.releaseNotes).text());

	$('#update').one("click", () => ipcRenderer.send('update-install'));
});

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};
