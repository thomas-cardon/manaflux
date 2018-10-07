var UI = {};

UI.stylizeRole = role => role === 'ADC' ? 'ADC' : role.charAt(0).toUpperCase() + role.slice(1);

/**
* Toggles or forces the loading indicator, or enables the loading indicator if parameter is a promise
* @param {toggle} boolean - Forces the loading indicator to be shown or hidden (until this method is triggered again)
*/
UI.loading = async (toggle = document.getElementById('loading').style.display === 'none') => {
  if (toggle.then) {
    document.getElementById('loading').style.display = 'block';
    const x = await toggle;
    document.getElementById('loading').style.display = 'none';
    return x;
  }

  return toggle ? document.getElementById('loading').style.display = 'block' : document.getElementById('loading').style.display = 'none';
}

/**
* Shows a status on the UI and logs it into the console
* @param {prefix} string - What will be written before the message in the consoles
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.status = (prefix, ...args) => {
  let x = i18n.__.call(i18n, ...args);
  let y = i18n.__d.call(i18n, ...args);

  $('.status').text(x + '...');
  console.log(2, `[${prefix}]`, y, '...');
};

let s, id;
/**
* Shows a status on the UI for 3 seconds
* @param {prefix} string - What will be written before the message in the consoles
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.temporaryStatus = (prefix, ...args) => {
  if (id) clearTimeout(id);
  else s = $('.status').text();

  UI.status.call(UI, prefix, ...args);

  id = setTimeout(() => {
    $('.status').text(s);
    id = null;
  }, 3000);
}

/**
* Shows an error on the UI and consoles it into LoggingHandler
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.error = function(...args) {
  $('#warning').show();

  if (args[0] instanceof Error) {
    alertify.notify(args[0].toString(), 'error', 10, () => $('#warning').hide());
    return console.error(1, args[0]);
  }

	let x = i18n.__.call(i18n, ...args);
	let y = i18n.__d.call(i18n, ...args);

	$('#warning').show();
	alertify.notify(args[0] instanceof Error ? args[0].toString() : x, 'error', 10, () => $('#warning').hide());
	return console.error(2, y);
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

/* Manual Button Handler */
$.fn.enableManualButton = function(cb, off) {
	if (off) $(this).off();
	$(this).prop('disabled', false).click(cb).show();

	return this;
}

$.fn.disableManualButton = function(disablesInsteadOfHiding) {
	$(this).off();

  if (disablesInsteadOfHiding) $(this).prop('disabled', true);
  else $(this).hide();

	return this;
}

/* Hextech Animation Handler */
UI.enableHextechAnimation = function(champion, primaryStyleId = 'white') {
	$('.championPortrait > #hextechAnimationBackground').attr('src', 'assets/img/vfx-' + primaryStyleId + '.png');
	$('.championPortrait > #champion')
	.attr('src', champion.img);

  if (Mana.getStore().get('ui-animations-enable')) $('.championPortrait > #champion').on('load', () => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
  else {
    $(".title").hide();
    $('.championPortrait').show();
  }
}

UI.disableHextechAnimation = () => {
	$('.championPortrait').hide();

	if (Mana.getStore().get('ui-animations-enable')) $(".title").animate({ "margin-top": "0%" }, 700, "linear");
  else $(".title").show();
}

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};
