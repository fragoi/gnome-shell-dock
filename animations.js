'use strict';

const { GObject, St } = imports.gi;

/* log facility */
function _log(msg) {
	if (log) log(`Dock animations: ${msg}`);
}

var DockSqueeze = GObject.registerClass(
	class DockSqueeze extends St.Bin {

		_init(minHeight = 1) {
			super._init({
				reactive: true,
				track_hover: true,
				height: minHeight
			});

			this._active = false;
			this._minHeight = minHeight;

			this.connect('notify::hover', () => this._onHover());
			this.connect('transition-stopped::height', () => this._onSetHeight());
		}

	/**
	 * Restores the actor to its original state.
	 */
	destroy() {
		this._changeTracker.destroy();
	}

		_onHover() {
			if (this.hover) {
				this._activate();
			} else {
				this._deactivate();
			}
		}

		_onSetHeight() {
			if (!this._active) return;
			/* unset height */
			this.set_height(-1);
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
			this._animateSetHeight(this._minHeight);
		}

		_animateSetHeight(height) {
			this.save_easing_state();
			this.set_height(height);
			this.restore_easing_state();
		}

		_getActiveHeight() {
			let themeNode = this.get_theme_node();
			let forWidth = themeNode.adjust_for_width(this.get_width());
			let [minHeight, natHeight] = this.get_child().get_preferred_height(forWidth);
			[minHeight, natHeight] = themeNode.adjust_preferred_height(minHeight, natHeight);
			/* avoid active height to be less than minimum height */
			return Math.max(this._minHeight, natHeight);
		}

	}
);
