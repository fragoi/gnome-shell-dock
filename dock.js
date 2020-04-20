'use strict';

const { GObject, St, Shell } = imports.gi;

var Dock = GObject.registerClass(
	class Dock extends St.BoxLayout {

		_init() {
			super._init({ style_class: 'dock' });

			this._appSystem = Shell.AppSystem.get_default();
			this._appSystemSignals = [
				this._appSystem.connect('installed-changed', () => this._onInstalledChanged()),
				this._appSystem.connect('app-state-changed', (s, a) => this._onAppStateChanged(s, a))
			];

			this._appSystem.get_running().forEach(e => this._runningApp(e));

			this.connect('allocation-changed', () => this._onAllocationChanged());
			this.connect('destroy', () => this._onDestroy());
		}

		_onInstalledChanged() {
			log('installed-changed');
		}

		_onAppStateChanged(s, a) {
			log(`app state changed ${a.get_name()}, ${a.get_state()}`);
			switch (a.get_state()) {
				case Shell.AppState.STOPPED: this._stoppedApp(a);
				case Shell.AppState.STARTING: this._startingApp(a);
				case Shell.AppState.RUNNING: this._runningApp(a);
			}
		}

		_onAllocationChanged() {
			this._setPosition();
		}

		_onDestroy() {
			log('destroy');
			this._appSystemSignals.forEach(e => {
				log(`disconnecting signal ${e}`);
				this._appSystem.disconnect(e);
			});
			this._appSystemSignals = [];
		}

		_stoppedApp(a) {
			log(`stopped app ${a.get_name()}`);
			let item = this._dockItem(a);
			if (item) {
				log(`destroy item ${item}`);
				item.destroy();
			}
		}

		_startingApp(a) {
			this._runningApp(a);
		}

		_runningApp(a) {
			if (!this._dockItem(a)) {
				this.add_child(new DockItem(a));
			}
		}

		_setPosition() {
			let parent = this.get_parent();
			if (!parent) return;
			let x = (parent.get_width() - this.get_width()) / 2;
			let y = (parent.get_height() - this.get_height());
			this.set_position(x, y);
		}

		_dockItem(a) {
			return this.get_children().find(e => e.app === a);
		}

	}
);

var DockItem = GObject.registerClass(
	class DockItem extends St.Bin {

		_init(app) {
			super._init({ style_class: 'dock-item' });

			this._app = app;
			this._icon = app.create_icon_texture(64);

			this.set_child(this._icon);
		}

		get app() {
			return this._app;
		}

	}
);
