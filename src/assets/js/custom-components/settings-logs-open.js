const { shell, remote } = require('electron');

module.exports = {
  click: function() {
    console.log(2, '[UI] Opening logs folder');
    shell.openItem(remote.app.getPath('logs'));
  }
};
