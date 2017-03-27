'use strict';

/**
 * Expose `Migration`.
 */

exports = module.exports = class Migration {
  constructor(title, up, down) {
    this.title = title;
    this.up = up;
    this.down = down;
  }
}
