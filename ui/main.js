//const _                = require("lodash");
const electron              = require('electron');
const {ipcRenderer} = electron;

const $toolbar_new          = $("#toolbar-new");
const $toolbar_dashboard    = $("#toolbar-dashboard");
//const $toolbar_analytics    = $("#toolbar-analytics");
const $toolbar_exit         = $("#toolbar-exit");

$(document).ready(function() {
	$toolbar_new.on("click", on_toolbar_new_click);
	$toolbar_dashboard.on("click", on_toolbar_dashboard_click);
	//$toolbar_analytics.on("click", on_toolbar_analytics_click);
	$toolbar_exit.on("click", on_toolbar_exit_click);
});

ipcRenderer.on("toolbar:open", function(event, data) {
});
ipcRenderer.on("main:toolbar:dashboard", function(event, data) {
});


function on_toolbar_new_click(e) {
	e.preventDefault();
	ipcRenderer.send("main:toolbar:new");
}

function on_toolbar_dashboard_click(e) {
	e.preventDefault();
	ipcRenderer.send("main:toolbar:dashboard");
}

function on_toolbar_analytics_click(e) {
	e.preventDefault();
	ipcRenderer.send("main:toolbar:analytics");
}

function on_toolbar_exit_click(e) {
	e.preventDefault();
	ipcRenderer.send("main:toolbar:exit");
}