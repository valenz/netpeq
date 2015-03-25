var fs = require('fs');
var br = require('bigrat').rational;

/**
 ********************************* EXPORTS *********************************
 */

module.exports.getMetadata = getMetadata;
module.exports.fileInfo = fileInfo;
module.exports.setUnit = setUnit;
module.exports.random = random;

/**
 ********************************* METHODS *********************************
 */

/**
 * Refactored and arranges the metadata.
 * @param {Object} md Metadata from file.
 * @return {String} m Refactored metadata.
 */
function getMetadata(md) {
	var m = {};
	m.streams = [];
	m.format = md.format;
	var w = 1, h = 1;

	md.streams.forEach(function(stream, i) {
		var streams = {};
		for(var s in md.streams[i]) {
			streams[s] = stream[s];
			w = s == 'width' ? stream[s] : 1;
			h = s == 'height' ? stream[s] : 1;
		}
		m.streams.push(streams);
	});

	var r = br.fromDecimal(w / h).toString();
	r = r != 1 ? r.split('/') : [1,1];
	r = r[0] +':'+ r[1];
	m.format.ratio = r;

	return m;
}

/**
 * Returns info from all files in a directory.
 * @param {String} p Path to directory.
 * @return {Array} fi File infos.
 */
function fileInfo(p) {
	var fi = [];

	var rd = fs.readdirSync(p);
	for(var i in rd) {
		var st = fs.statSync(p+rd[i]);
		fi.push({name: rd[i], size: setUnit(st.size)});
	}

	return fi;
}

/**
 * Calculates the unit of measurement of the amount of data.
 * @param {Number|String} n Amount of data in Bytes (B).
 * @return {String} n Converted to the next higher unit of measurement.
 */
function setUnit(n) {
	var l = n.toString().length;
	if(l >= 4 && l <= 6) {
		return +(n / 1024).toFixed(2) +' KB';
	} else if(l >= 7 && l <= 9) {
		return +(n / Math.pow(1024, 2)).toFixed(2) +' MB';
	} else if(l >= 10 && l <= 12) {
		return +(n / Math.pow(1024, 3)).toFixed(2) +' GB';
	} else if(l >= 13) {
		return +(n / Math.pow(1024, 4)).toFixed(2) +' TB';
	} else {
		return n +' B';
	}
}

/**
 * Returns random string depending on given length.
 * @param {Number} len
 * @return {String} str
 */
function random(len) {
  var c = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var l = len >= 10 ? len : 24;
  var str = '';

  for (var i = 0; i < l; i++) {
    var n = Math.floor(Math.random() * c.length);
    str = str.concat(c.substring(n, n + 1));
  }

  return str;
}
