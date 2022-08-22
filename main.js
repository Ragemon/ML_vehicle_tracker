"use strict";

const {app, BrowserWindow, Menu, Tray} = require('electron')

let winMain, tray;

app.on('ready', mainWindow)
app.on('window-all-closed', () => {
	if(process.platform !== 'darwin') {
		app.quit()
	}
})
app.on('activate', () => {
	if(winMain === null) {
		mainWindow()
	}
})

function mainWindow() {
	createTray();
	winMain = new BrowserWindow({
		width: 1000,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
		},
		minWidth: 300,
		minHeight: 150,
	})
	let mainMenu = new Menu.buildFromTemplate(require("./menu").debugMenu(app))
	winMain.loadFile('index.html')
	Menu.setApplicationMenu(mainMenu);
	winMain.on('closed', () => {
		winMain = null
	})
}

function createTray() {
	tray = new Tray("iconTemplate@2x.png")
	tray.setToolTip("Traffic Count");
	tray.on('click', function(e) {
		winMain.isVisible() ? winMain.hide() : winMain.show();
	})
}

