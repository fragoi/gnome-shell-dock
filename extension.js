'use strict';

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Dock = Me.imports.dock.Dock;

let dock;

function init() { }

function enable() {
	_log('enabling...');
	dock = new Dock();
	Main.layoutManager.addChrome(dock);
	_log('enabled');
}

function disable() {
	_log('disabling...');
	if (dock) {
		dock.destroy();
		dock = null;
	}
	_log('disabled');
}

/**
 * Prefix the message with the extension name.
 */
function _log(msg) {
	log(`${Me.metadata.name}: ${msg}`);
}
