var o = new Object();

/**
 * Constructor
 */
function Render() {}

/**
 * Class method getter
 * @return {o} Object
 */
Render.prototype.get = function() {
	return this.o;
};

/**
 * Class method setter
 * @param {o} Object
 */
Render.prototype.set = function(o) {
	this.o = o;
};

// Exports class
module.exports = Render;