'use strict';

const { GObject, St, Shell, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Animations = Me.imports.animations;

/* TODO: configure this */
const ICON_SIZE = 64;

/* log facility */
function _log(msg) {
	if (log) log(`Dock: ${msg}`);
}

var Dock = GObject.registerClass(
	class Dock extends St.Bin {

		_init() {
			super._init();

			/* activation animation */
			this._animation = new Animations.DockSqueeze();
			this.set_child(this._animation);

			/* dock visible graphics */
			this._dock = new St.Bin({ style_class: 'dock' });
			this._animation.set_child(this._dock);

			/* apps management */
			this._appBox = new DockAppBox();
			this._dock.set_child(this._appBox);

			this.connect('parent-set', () => this._onParentSet());
		}

		_onParentSet() {
			/* alignment */
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

	}
);

var DockAppBox = GObject.registerClass(
	class DockAppBox extends St.BoxLayout {

		_init() {
			super._init();

			this._appSystem = Shell.AppSystem.get_default();
			this._appSystemHIDs = [
				this._appSystem.connect('installed-changed', () => this._onInstalledChanged()),
				this._appSystem.connect('app-state-changed', (s, a) => this._onAppStateChanged(a))
			];

			this.connect('destroy', () => this._onDestroy());

			/* add already running apps */
			this._runningApps();
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

		_runningApps() {
			/* returns the minimum window sequence ID */
			let minWinIdF = app => app.get_windows()
				.map(win => win.get_stable_sequence())
				.reduce(Math.min);
			/* maps the app with its minimum window sequence ID */
			let mapAppIdF = app => ({ app: app, id: minWinIdF(app) });
			/* running apps */
			this._appSystem.get_running()
				/* map the apps with their mininum window sequence ID */
				.map(mapAppIdF)
				/* sort the apps using their ID */
				.sort((a, b) => a.id - b.id)
				/* add the apps to the dock */
				.forEach(e => {
					_log(`add running app: ${e.app.get_name()}, with ID: ${e.id}`)
					this._runningApp(e.app);
				});
		}

		_dockApp(a) {
			return this.get_children().find(e => e.app === a);
		}

		_onDestroy() {
			_log('destroy');
			this._appSystemHIDs.forEach(e => {
				_log(`disconnecting signal: ${e}`);
				this._appSystem.disconnect(e);
			});
			this._appSystemHIDs = [];
		}

	}
);

var DockApp = GObject.registerClass(
	class DockApp extends St.Button {

		_init(app) {
			super._init({
				style_class: 'dock-item',
				reactive: true,
				can_focus: true,
				track_hover: true
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
			this._app.activate();
		}

	}
);
