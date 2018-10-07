/* Gives jQuery show/hide events */
(function($) {
	$.each(['show', 'hide'], function(i, ev) {
		var el = $.fn[ev];
		$.fn[ev] = function() {
			this.trigger(ev);
			return el.apply(this, arguments);
		};
	});
})(jQuery);

module.exports = {
  metadata: ['jQueryOnly'],
  show: function() {
    ipcRenderer.on('perks-shortcut', (event, next) => {
      console.log(2, `[Shortcuts] Selecting ${next ? 'next' : 'previous'} position..`);

      const keys = Object.keys(data);
      let i = keys.length, positionIndex = keys.indexOf(document.getElementById('positions').value);
      let newIndex = positionIndex;

      if (next) {
        if (newIndex === i - 1) newIndex = 0;
        else newIndex++;
      }
      else {
        if (newIndex === 0) newIndex = i - 1;
        else newIndex--;
      }

      /* Useless to change position if it's already the one chosen */
      if (newIndex !== positionIndex) $('#positions').val(keys[newIndex]).trigger('change');
    });
  },
  hide: () => ipcRenderer.removeAllListeners('perks-shortcut')
};
