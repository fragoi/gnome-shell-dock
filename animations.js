'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ChangeTracker = Me.imports.changeTracker;

var Squeeze = class Squeeze {

	/**
	 * @param actor - an St.Bin actor to animate
	 */
	constructor(actor) {
		this._actor = actor;
		this._active = false;
		this._minHeight = 1;

		this._changeTracker = new ChangeTracker.StWidget(actor);

		this._changeTracker.set_height(this._minHeight);
		this._changeTracker.set_reactive(true);
		this._changeTracker.set_track_hover(true);

		this._changeTracker.connect('notify::hover', () => this._onHover());
		this._changeTracker.connect('transition-stopped::height', () => this._onSetHeight());
	}

	/**
	 * Restores the actor to its original state.
	 */
	destroy() {
		this._changeTracker.destroy();
	}

	_onHover() {
		if (this._actor.hover) {
			this._activate();
		} else {
			this._deactivate();
		}
	}

	_onSetHeight() {
		if (!this._active) return;
		/* unset height */
		this._actor.set_height(-1);
	}

	_activate() {
		if (this._active) return;
		this._active = true;
		let height = this._getActiveHeight();
		this._animateSetHeight(height);
	}

	_deactivate() {
		if (!this._active) return;
		this._active = false;
		let height = this._minHeight;
		this._animateSetHeight(height);
	}

	_animateSetHeight(height) {
		let actor = this._actor;
		actor.save_easing_state();
		actor.set_height(height);
		actor.restore_easing_state();
	}

	_getActiveHeight() {
		let actor = this._actor;
		let themeNode = actor.get_theme_node();
		let forWidth = themeNode.adjust_for_width(actor.get_width());
		let [minHeight, natHeight] = actor.get_child().get_preferred_height(forWidth);
		[minHeight, natHeight] = themeNode.adjust_preferred_height(minHeight, natHeight);
		return Math.max(this._minHeight, natHeight);
	}

}
