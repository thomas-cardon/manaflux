/* Custom components */
for (const el of document.querySelectorAll('[data-custom-component]')) {
  log.log(2, `[UI] [Custom Components] Loading ${el.dataset.customComponent}`);

  const d = require(__dirname + '\\assets\\js\\custom-components\\' + el.dataset.customComponent + '.js');

  if (typeof d === 'object')
    for (const [event, f] of Object.entries(d))
      el.addEventListener(event, f);
  else d.apply(el);
}
