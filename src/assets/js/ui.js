var UI = {};

UI.error = function(err) {
	$('#warning').show();
}

UI.tray = function(tray = true) {
	console.log(`${tray ? 'Enabling' : 'Disabling'} Tray Mode.`);

	if (tray) {
		ipcRenderer.send('win-hide');
		ipcRenderer.send('tray', true);
	}
	else {
		ipcRenderer.send('tray', false);
		ipcRenderer.send('win-show');
	}
}


window.onbeforeunload = (e) => UI.tray(false);
ipcRenderer.on('error', (event, data) => UI.error(data));

/*
* Manual Button Handler
*/

$.fn.enableManualButton = function(cb) {
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
	.ready(() => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
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
$(document).ready(function() {
	$(':checkbox[data-settings-key]').each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${Mana.store.get($(this).data('settings-key'))}`);
		$(this).prop('checked', Mana.store.get($(this).data('settings-key')));
	});

	$('select[data-settings-key]').each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${Mana.store.get($(this).data('settings-key'))}`);
		$(this).val(Mana.store.get($(this).data('settings-key')));
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

$(document).ready(function() {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + Mana.store.get('theme') + "')");
});

$('select[data-settings-key=theme]').change(function() {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + this.value + "')");
})

ipcRenderer.once('update-ready', async (event, data) => {
	console.log('Update available ! version: ' + data.version);
	console.dir(data);

	$('.tablinks[data-tabid="update"]').show();

	$('.tabcontent[data-tabid="update"] > #version').text(`Version ${data.version}`);
	$('.tabcontent[data-tabid="update"] > #size').text(getReadableFileSizeString(data.files[0].size));

	$('.tabcontent[data-tabid="update"] > .textcontainer').text(jQuery(data.releaseNotes).text());

	$('.tabcontent[data-tabid="update"] > #update').one("click", () => ipcRenderer.send('update-install'));
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
