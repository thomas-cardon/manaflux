let Sidebar = {
  off: function() {
    remote.getCurrentWindow().setContentSize(remote.getCurrentWindow().getContentSize()[0] - 200, remote.getCurrentWindow().getContentSize()[1]);
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('window').style.left = '0px';
    document.getElementById('footer').style.left = '20px';
  },
  on: function() {
    remote.getCurrentWindow().setContentSize(remote.getCurrentWindow().getContentSize()[0] + 200, remote.getCurrentWindow().getContentSize()[1]);
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('window').style.left = '200px';
    document.getElementById('footer').style.left = '220px';
  },
  reset: function() {
    if (remote.getCurrentWindow().getContentSize()[0] >= 800)
      remote.getCurrentWindow().setContentSize(600, remote.getCurrentWindow().getContentSize()[1]);
  }
};

module.exports = {
  load: function(Mana) {
    UI.sidebar = Sidebar;
    Sidebar.reset();
  },
  userConnected: function(e) {
    Sidebar.on();
  },
  userDisconnected: function(e) {
    Sidebar.off();
  }
};
