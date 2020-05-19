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
	 * Generic method for a basic attribute, where the current value of the attribute
	 * can be read via its getter method without causing any side effect, and the new
	 * value can be set via its setter method.
	 * On revert the old value is set via setter method.
	 */
	_setBasicAttribute(attr, newValue) {
		let getter = 'get_' + attr;
		let setter = 'set_' + attr;
		let oldValue = this._actor[getter]();
		this._actor[setter](newValue);
		this._reverters.push(() => {
			this._actor[setter](oldValue);
		});
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

	/**
	 * Connects an handler to a signal.
	 * On revert the handler is disconnected.
	 */
	connect() {
		let handlerId = this._actor.connect.apply(this._actor, arguments);
		this._reverters.push(() => this._actor.disconnect(handlerId));
	}

	/**
	 * Set the properties of the given object on the actor.
	 * On revert the properties are restored to their previous value.
	 */
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
		this._setBasicAttribute('reactive', value);
	}

}

var StWidget = class StWidget extends ClutterActor {

	constructor(actor) {
		super(actor);
	}

	set_can_focus(value) {
		this._setBasicAttribute('can_focus', value);
	}

	set_track_hover(value) {
		this._setBasicAttribute('track_hover', value);
	}

}
