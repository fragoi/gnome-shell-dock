'use strict';

const { GObject, St, Shell, Clutter } = imports.gi;

/* TODO: configure this */
const ICON_SIZE = 64;

/* log facility */
function _log(msg) {
	if (log) log(`Dock: ${msg}`);
}

var Dock = GObject.registerClass(
	class Dock extends St.BoxLayout {

		_init() {
			super._init({
				style_class: 'dock',
				reactive: true,
				can_focus: true,
				track_hover: true
			});

			this._appSystem = Shell.AppSystem.get_default();
			this._appSystemSignals = [
				this._appSystem.connect('installed-changed', () => this._onInstalledChanged()),
				this._appSystem.connect('app-state-changed', (s, a) => this._onAppStateChanged(a))
			];

			/* add already running apps */
			this._appSystem.get_running().forEach(e => this._runningApp(e));

			this.connect('parent-set', () => this._onParentSet());
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

		_dockApp(a) {
			return this.get_children().find(e => e.app === a);
		}

		_onParentSet() {
			_log(`parent-set`);
			let parent = this.get_parent();
			let xalign = new Clutter.AlignConstraint({
				source: parent,
				align_axis: Clutter.AlignAxis.X_AXIS,
				factor: 0.5
			});
			let yalign = new Clutter.AlignConstraint({
				source: parent,
				align_axis: Clutter.AlignAxis.Y_AXIS,
				factor: 1
			});
			this.add_constraint_with_name('xalign', xalign);
			this.add_constraint_with_name('yalign', yalign);
		}

		_onDestroy() {
			_log('destroy');
			this._appSystemSignals.forEach(e => {
				this._appSystem.disconnect(e);
			});
			this._appSystemSignals = [];
		}

	}
);

var DockApp = GObject.registerClass(
	class DockApp extends St.Button {

		_init(app) {
			super._init({
				style_class: 'dock-item',
				reactive: true
			});

			this._app = app;
			this._icon = app.create_icon_texture(ICON_SIZE);

			this.set_child(this._icon);

			this.connect('clicked', () => this._clicked());
		}

		get app() {
			return this._app;
		}

		_clicked() {
			_log('clicked');
		}

	}
);
