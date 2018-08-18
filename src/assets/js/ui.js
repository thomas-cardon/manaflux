var UI = {};

UI.error = function(err) {
	$('#warning').show();
	alertify.notify(err instanceof Error ? err.toString() : err, 'error', 10, () => $('#warning').hide());
	console.error(err);
}

UI.success = msg => alertify.notify(msg, 'success', 10);

UI.tray = function(tray = true) {
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
	$('.championPortrait > #bg').attr('src', 'assets/img/vfx-' + (primaryStyleId ? primaryStyleId : 'white') + '.png');
	$('.championPortrait > #champion')
	.attr('src', championKey ? `https://ddragon.leagueoflegends.com/cdn/${Mana.gameVersion}.1/img/champion/${championKey.charAt(0) + championKey.slice(1).toLowerCase()}.png` : 'assets/img/-1.png')
	.on('load', () => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
}

UI.disableHextechAnimation = () => {
	$('.championPortrait').hide();
	$(".title").animate({ "margin-top": "0%" }, 700, "linear");
}

// Navigation menus (if there's multiple tabs for the same thing such as settings)
let navigationId = 0;
UI.nav = n => {
	const tabcontent = $(`.tabcontent[data-tabid=${$('.tablinks.active').data('tabid')}][data-tabn=${navigationId + n}]`);
	if (tabcontent.length > 0) {
		navigationId += n;

		console.log(`[Navigation] Heading to tab #${tabcontent.data('tabid')}, n:${navigationId}`);
		$('.tabcontent').hide();
		tabcontent.show();
	}
	else console.log(`[Navigation] Can't navigate to tab #${$('.tablinks.active').data('tabid')}, n:${navigationId + n}`);
}

/*
* Tab Handler
*/
$(document).ready(function() {
	$('[data-i18n]').each(function() {
		console.log(`[Localization] Loading value: ${$(this).data('i18n')}`);
		$(this).text(i18n.__($(this).data('i18n')));
	});

	$('.tablinks').click(function() {
		$('.tabcontent').hide();
		$(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=0]`).show();

		$('.tablinks').removeClass('active');
		$(this).addClass('active');

		/* Navigation Menus */
		if ($(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=1]`).length) $('#nav-menu').show();
		else $('#nav-menu').hide();

		document.getElementById("selected").style.marginLeft = ($(this).offset().left + ($(this).width() / 2)) + 'px';
	});

	$('button[data-tabid="home"]').click();
});

/*
* Settings
*/
Mana.once('settings', store => {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + Mana.store.get('theme') + "')");

	/* select element support */
	$('select[data-settings-key]').change(function() {
		console.log(`Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
		store.set($(this).data('settings-key'), this.value);
	}).each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).val(store.get($(this).data('settings-key')));
	});

	/* checkbox element support */
	$(':checkbox[data-settings-key]').each(function() {
		console.log(`Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).prop('checked', store.get($(this).data('settings-key')));

		$(this).prop('id', $(this).data('settings-key'));
		$(this).siblings('label').prop('for', $(this).data('settings-key'));
	}).change(function() {
		console.log(`Changing value of ${$(this).data('settings-key')} to: ${$(this).is(":checked")}`);
		store.set($(this).data('settings-key'), $(this).is(":checked"));
	});

	/* sortable lists support */
	$(".sortable[data-settings-key]").each(function() {
		$(this).sortable({
			update: function(event, ui) {
				let array = [];
				$(this).children().each(function() {
					array.push($(this).attr('value'));
				});
				
				store.set($(this).data('settings-key'), array);
				console.log(`Changing value of #${$(this).data('settings-key')} to: ${array}`);
			}
		});

		const values = store.get($(this).data('settings-key'), $(this).data('settings-sortable-list-values').split(','));

		for (let i = 0; i < values.length; i++)
			$(this).append(`<li class="ui-state-default sortable-button" value="${values[i]}">${i18n.__('settings-' + $(this).data('settings-key') + '-' + values[i])}</li>`);
	})
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
