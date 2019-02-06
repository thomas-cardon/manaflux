/* Tab Handler */
UI.dots = {
	isEnabled: document.getElementById('dots') !== null
};

UI.dots.load = function() {
	document.querySelectorAll('.tabcontent').forEach(tab => {
		const title = tab.getAttribute('data-tabtitle');
		const isDisabled = tab.hasAttribute('data-disabled');

		if (!title) return;
		tab.childNodes.forEach(elem => {
			if (!elem.style) return;

			if (elem.className === 'tab-info') elem.style.display = isDisabled ? 'block' : 'none';
			else elem.style.display = !isDisabled ? 'block' : 'none';
		});
	});
}

UI.dots.onClickEvent = function(dot, tabId, i) {
	document.querySelectorAll('.tabcontent').forEach(x => x.style.display = 'none');
	document.querySelector(`.tabcontent[data-tabid="${tabId}"][data-tabn="${i}"]`).style.display = 'block';

	if (!UI.dots.isEnabled || !dot) return;

	if (UI.dots.lastSelected)
		UI.dots.lastSelected.classList.remove('selected');

	dot.classList.add('selected');
	UI.dots.lastSelected = dot;

	Sounds.play('buttonClick');
}

document.addEventListener("DOMContentLoaded", function() {
	document.querySelectorAll('.btn.tab').forEach(tab => {
		tab.addEventListener('click', event => {
			Sounds.play('buttonClick');

			document.querySelector('.tab.active').classList.remove('active');
			event.target.classList.add('active');

			const dotsNumber = document.querySelectorAll(`.tabcontent[data-tabid="${$(event.target).data('tabid')}"]`).length;

			if (dotsNumber === 0) UI.dots.onClickEvent(null, event.target.getAttribute('data-tabid'), 0);
			else if (UI.dots.isEnabled) {
				let dots = document.getElementById('dots');
				while (dots.firstChild) dots.removeChild(dots.firstChild);

				if (dotsNumber > 1)
					for (let i = 0; i < dotsNumber; i++) {
						const dot = document.createElement('div');

						dot.className = 'dot';
						dot.onclick = () => UI.dots.onClickEvent(dot, $(event.target).data('tabid'), i);
						dots.appendChild(dot);
					}

				UI.dots.onClickEvent(dots.firstChild, event.target.getAttribute('data-tabid'), 0);
			}

			document.getElementById('selected').style.left = event.target.offsetLeft + (event.target.offsetWidth / 2) - (document.getElementById('selected').offsetWidth / 2);

			if (UI.dots.isEnabled)
				document.getElementById('dots').style.left = event.target.offsetLeft + (event.target.offsetWidth / 2) - (document.getElementById('dots').offsetWidth / 2);
		});
	});

	setTimeout(() => document.querySelector('.btn.tab').click(), 100);
});
