'use strict';

/* log facility */
function _log(msg) {
	if (log) log(`ChangeTracker: ${msg}`);
}

var ClutterActor = class ClutterActor {

	constructor(actor) {
		this._actor = actor;
		this._reverters = [];
	}

	/**
	 * Reverts the changes.
	 */
	destroy() {
		let e;
		while ((e = this._reverters.pop()) !== undefined) {
			e();
		}
	}

	connect() {
		let handlerId = this._actor.connect.apply(this._actor, arguments);
		this._reverters.push(() => this._actor.disconnect(handlerId));
	}

	set_props(props) {
		let oldProps = {};
		for (let p in props) {
			oldProps[p] = this._actor[p];
			this._actor[p] = props[p];
		}
		this._reverters.push(() => {
			for (let p in oldProps) {
				this._actor[p] = oldProps[p];
			}
		});
	}

	set_height(value) {
		let oldMin = this._actor.min_height;
		let oldMinSet = this._actor.min_height_set;
		let oldNat = this._actor.natural_height;
		let oldNatSet = this._actor.natural_height_set;
		this._actor.set_height(value);
		this._reverters.push(() => {
			this._actor.min_height = oldMin;
			this._actor.min_height_set = oldMinSet;
			this._actor.natural_height = oldNat;
			this._actor.natural_height_set = oldNatSet;
		});
	}

	set_reactive(value) {
		let oldValue = this._actor.get_reactive();
		this._actor.set_reactive(value);
		this._reverters.push(() => this._actor.set_reactive(oldValue));
	}

}

var StWidget = class StWidget extends ClutterActor {

	constructor(actor) {
		super(actor);
	}

	set_can_focus(value) {
		let oldValue = this._actor.get_can_focus();
		this._actor.set_can_focus(value);
		this._reverters.push(() => this._actor.set_can_focus(oldValue));
	}

	set_track_hover(value) {
		let oldValue = this._actor.get_track_hover();
		this._actor.set_track_hover(value);
		this._reverters.push(() => this._actor.set_track_hover(oldValue));
	}

}
