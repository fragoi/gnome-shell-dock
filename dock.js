'use strict';

const { GObject, St, Shell } = imports.gi;

/* TODO: configure this */
const ICON_SIZE = 64;

/* log facility */
function _log(msg) {
	if (log) log(`Dock: ${msg}`);
}

var Dock = GObject.registerClass(
	class Dock extends St.BoxLayout {

		_init() {
			super._init({ style_class: 'dock' });

			this._appSystem = Shell.AppSystem.get_default();
			this._appSystemSignals = [
				this._appSystem.connect('installed-changed', () => this._onInstalledChanged()),
				this._appSystem.connect('app-state-changed', (s, a) => this._onAppStateChanged(a))
			];

			/* add already running apps */
			this._appSystem.get_running().forEach(e => this._runningApp(e));

			this.connect('allocation-changed', () => this._onAllocationChanged());
			this.connect('destroy', () => this._onDestroy());
		}

		_onInstalledChanged() {
			_log('installed-changed');
		}

		_onAppStateChanged(a) {
			_log(`app-state-changed: ${a.get_name()} -> ${a.get_state()}`);
			switch (a.get_state()) {
				case Shell.AppState.STOPPED: this._stoppedApp(a); break;
				case Shell.AppState.STARTING: this._startingApp(a); break;
				case Shell.AppState.RUNNING: this._runningApp(a); break;
			}
		}

		_onAllocationChanged() {
			_log('allocation-changed');
			this._setPosition();
		}

		_onDestroy() {
			_log('destroy');
			this._appSystemSignals.forEach(e => {
				this._appSystem.disconnect(e);
			});
			this._appSystemSignals = [];
		}

		_stoppedApp(a) {
			_log(`stopped-app: ${a.get_name()}`);
			let item = this._dockApp(a);
			if (item) {
				item.destroy();
			}
		}

		_startingApp(a) {
			_log(`starting-app: ${a.get_name()}`);
			this._runningApp(a);
		}

		_runningApp(a) {
			_log(`running-app: ${a.get_name()}`);
			if (!this._dockApp(a)) {
				this.add_child(new DockApp(a));
			}
		}

		_setPosition() {
			let parent = this.get_parent();
			if (!parent) return;
			let x = (parent.get_width() - this.get_width()) / 2;
			let y = (parent.get_height() - this.get_height());
			_log(`set-position: ${x}, ${y}`);
			this.set_position(x, y);
		}

		_dockApp(a) {
			return this.get_children().find(e => e.app === a);
		}

	}
);

var DockApp = GObject.registerClass(
	class DockApp extends St.Bin {

		_init(app) {
			super._init({ style_class: 'dock-item' });

			this._app = app;
			this._icon = app.create_icon_texture(ICON_SIZE);

			this.set_child(this._icon);
		}

		get app() {
			return this._app;
		}

	}
);
