const { captureException } = require('@sentry/electron');
var UI = {};

UI.stylize = UI.stylizeRole = (role = 'unknown') => {
  switch(role.toLowerCase()) {
    case 'aram':
      return 'ARAM';
    case 'adc':
      return 'ADC';
    case 'twisted_treeline':
      return '3vs3';
    case 'classic':
      return '5vs5';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}

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
let s, id;
UI.status = (...args) => {
  let x = i18n.__.call(i18n, ...args.slice(args[0].then ? 1 : 0)).slice(0, 42);

  if (args[0].then)
    return new Promise((resolve, reject) => {
      $('.status').text(x + '...');
      args[0].then(x => {
        $('.status').text(s);
        resolve(x);
      }).catch(reject);
    });

  $('.status').text(s = x + '...');
};

/**
* Shows a status on the UI for 3 seconds
* @param {prefix} string - What will be written before the message in the consoles
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.temporaryStatus = (...args) => {
  return UI.status(new Promise(resolve => setTimeout(resolve, 3000)), ...args);
}

/**
* Shows a status and adds a loading that shows with a promise
* @param {prefix} string - What will be written before the message in the consoles
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.indicator = (promise, ...args) => {
  UI.status(promise, ...args);
  return UI.loading(promise);
}

/**
* Shows an error on the UI and consoles it into LoggingHandler
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the consoles
* @param {parameters} string... - Translation parameters
*/
UI.error = function(...args) {
  $('#warning').show();

  if (args[0] instanceof Error) {
    console.error(args[0]);

    captureException(args[0]);
    alertify.notify(args[0].toString(), 'error', 10, () => $('#warning').hide());
    return args[0];
  }

	let x = i18n.__.call(i18n, ...args);
	let y = i18n.__d.call(i18n, ...args);

	alertify.notify(x, 'error', 10, () => $('#warning').hide());

	return new Error(y);
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

$.fn.disableManualButton = function(disable) {
	$(this).off();

  if (disable) $(this).prop('disabled', true);
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
