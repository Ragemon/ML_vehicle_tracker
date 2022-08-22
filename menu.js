module.exports = {
	debugMenu: function(app) {
		return [{
			label: "File",
			submenu: [
				{
					label: "Quit",
					accelerator: (process.platform === 'darwin') ?
						'Command+Q' : 'Ctrl+Q',
					click: app.quit,
				}
			]
		}, {
			label: 'View',
			submenu: [
				//{role: 'forcereload'},
				{
					accelerator: 'Ctrl+R',
					label: 'Reload',
					click: function(item, focusedWindow) {
						focusedWindow.webContents.reloadIgnoringCache();
					}
				},
				{
					accelerator: 'Ctrl+Shift+I',
					label: 'DevTools',
					click: function(item, focusedWindow) {
						focusedWindow.toggleDevTools();
					}
				}
			]
		}]
	},
	productionMenu: function(app) {
		return null;
	}
};
