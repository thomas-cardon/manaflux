/* Custom components */
$(document).ready(function() {
  $('[data-custom-component]').each(function() {
    const key = $(this).data('custom-component');

    log.log(2, `[UI] [Custom Components] Loading ${key}`);

    const d = require(__dirname + '\\assets\\js\\custom-components\\' + key + '.js');

    if (typeof d === 'object')
      for (const [event, f] of Object.entries(d))
        $(this).on(event, f);
    else $(this).on($(this).data('custom-component-event') || 'click', d);
  });
});
