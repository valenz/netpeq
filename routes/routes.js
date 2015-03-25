var RenderObject = require('../classes/render');
var methods = require('../methods/methods');
var presets = require('../methods/presets');
var FFmpeg = require('fluent-ffmpeg');
var config = require('../config');
var winston = require('winston');
var fs = require('fs');

var log = winston.loggers.get('log');

/**
 ********************************* EXPORTS *********************************
 */

module.exports.index = index;
module.exports.ugrid = ugrid;
module.exports.ogrid = ogrid;
module.exports.agrid = agrid;
module.exports.upload = upload;
module.exports.queue = queue;

module.exports.postUpload = postUpload;
module.exports.postDelete = postDelete;
module.exports.postUpdate = postUpdate;
module.exports.postRender = postRender;

/**
 ******************************* GET METHODS *******************************
 */

function index(req, res) {
	var ro = new RenderObject();
	ro.set({
		title: 'FFmpeg',
		info: req.flash('info'),
		error: req.flash('error'),
		success: req.flash('success')
	});
	res.render('index', ro.get());
}

function ugrid(req, res) {
	var dir = config.custom.upload;

	var ro = new RenderObject();
	ro.set({
		title: 'Upload Grid',
		path: 'data/upload',
		files: methods.fileInfo(dir),
		info: req.flash('info'),
		error: req.flash('error'),
		success: req.flash('success')
	});
	res.render('sites/grid', ro.get());
}

function ogrid(req, res) {
	var dir = config.custom.output;

	var ro = new RenderObject();
	ro.set({
		title: 'Output Grid',
		path: 'data/output',
		files: methods.fileInfo(dir),
		info: req.flash('info'),
		error: req.flash('error'),
		success: req.flash('success')
	});
	res.render('sites/grid', ro.get());
}

function agrid(req, res) {
	var dir = config.custom.assets;

	var ro = new RenderObject();
	ro.set({
		title: 'Asset Grid',
		path: 'data/assets',
		files: methods.fileInfo(dir),
		info: req.flash('info'),
		error: req.flash('error'),
		success: req.flash('success')
	});
	res.render('sites/grid', ro.get());
}

function upload(req, res) {
	var ro = new RenderObject();
	ro.set({
		title: 'Upload',
		info: req.flash('info'),
		error: req.flash('error'),
		success: req.flash('success')
	});
	res.render('sites/upload', ro.get());
}

function queue(_renderids) {
	return function(req, res) {
		var dir = config.custom.queue;
		var queue = {};
		queue.process = [];
		queue.length = Object.keys(_renderids).length;
		for(var p in _renderids) {
			var process = {};
			process.rid = p;
			process.command = _renderids[p];

			queue.process.push(process);
		}

		var ro = new RenderObject();
		ro.set({
			title: 'Render Queue',
			queue: queue,
			info: req.flash('info'),
			error: req.flash('error'),
			success: req.flash('success')
		});
		res.render('sites/queue', ro.get());
	}
}

/**
 ******************************* POST METHODS *******************************
 */

function postUpload(req, res) {
	log.debug(req.body);
	log.debug(req.files);

	var files = req.files.upload.length > 1 ? req.files.upload : [req.files.upload];

	files.forEach(function(file, i) {
		fs.exists(file.path, function (exists) {
	  	if (exists) {
				fs.readFile(file.path, function(err, data) {
					if(err) {
						req.flash('error', 'One or more files could not be saved because '+
							'the content data could not be read.');
						res.redirect('/upload');
						throw new Error (err);
					}

					var name = req.body.name ? req.body.name +'.'+ file.extension : file.originalname;
					var dir = req.body.asset ? config.custom.assets : config.custom.upload;

					fs.writeFile(dir + name, data, function(err) {
						if(err) {
							req.flash('error', 'One or more files could not be saved because '+
								'the content data could not be written.');
							res.redirect('/upload');
							throw new Error (err);
						}

						fs.unlink(file.path, function(err) {
		          if(err) throw new Error(err);
						});

						log.debug('File uploaded:', file);
						log.info('File uploaded:', dir + name);

						if(i == files.length-1) {
							req.flash('success', '%s file/s were uploaded successfully.', i+1);
							res.redirect('/upload');
						}
					});

				});
			} else {
				log.debug('File not uploaded:', file);
				log.error('File not uploaded:', dir + name);
				req.flash('error', 'One or more files could not be saved because they '+
					'were not found.');
				res.redirect('/upload');
			}
		});
	});
}

function postDelete(req, res) {
	log.debug(req.body);
	log.debug(req.path);

	var tmp = req.body.delete.split('/');
	var file = tmp.pop();
	var dir = tmp.toString().replace(/,/g, '/');
	var pathToFile = 'public/' + dir +'/'+ file;

  fs.exists(pathToFile, function(exists) {
    if(exists) {
      try {
        fs.unlink(pathToFile, function(err) {
          if(err) throw new Error(err);

					log.info('Deleted file "%s".', file);
					req.flash('success', 'File "%s" has been deleted successfully.', file);

					switch(tmp.pop()) {
						case 'upload':
							res.redirect('/ugrid');
							break;
						case 'output':
							res.redirect('/ogrid');
							break;
						case 'assets':
							res.redirect('/agrid');
							break;
						default:
							res.redirect('/');
							break;
					}
        });
      } catch(e) {
				log.error(e.stack);
      }
    } else {
			log.error('Could not delete file.', dir, file);
			req.flash('error', 'Could not delete file. Incorrect path "%s" or file '+
				'"%s" does not exists.', dir, file);
			res.redirect('/');
    }
  });
}

function postUpdate(req, res) {
	var dir = config.custom.assets;

	var tmp = req.body.update.split('/');
	var file = tmp.pop();
	var path = tmp.toString().replace(/,/g, '/');
	var pathToFile = 'public/'+ path +'/'+ file;
  var renderid = methods.random();

	fs.exists(pathToFile, function(exists) {
		if(exists) {
			FFmpeg.ffprobe(pathToFile, function(err, metadata) {
				if(err) throw new Error(err);

				var md = methods.getMetadata(metadata);

				var ro = new RenderObject();
				ro.set({
					title: 'Update',
					path: path,
					file: file,
					renderid: renderid,
					assets: methods.fileInfo(dir),
					assetsDir: 'data/assets',
					filesize: methods.setUnit(md.format.size),
					streams: md.streams,
					format: md.format,
		      info: req.flash('info'),
		  		error: req.flash('error'),
		  		success: req.flash('success')
				});
				res.render('sites/update', ro.get());
			});
		} else {
			log.error('Could not find file.', dir, file);
			req.flash('error', 'Could not find file. Incorrect path "%s" or file '+
				'"%s" does not exists.', dir, file);
			res.redirect('/');
		}
	});
}

function postRender(io, _renderids) {
	return function(req, res) {
		log.debug(req.body);
	  var rid = req.body.rid;
		var path = req.body.path;
		var file = req.body.filenameNew ? req.body.filenameNew.split('.') : req.body.filenameOrig.split('.'); // file.name.mp4 = [file, name, mp4]
		var filename = ''; // filename
		if(file.length > 1) {
			var format = file[file.length-1]; // mp4, mpg
			for(var i = 0; i < file.length-1; i++) {
				filename += i+1 == file.length-1 ? file[i] : file[i] +'.'; // file.name
			}
		} else {
			filename = file[0] || 'output';
		}

		if(filename.split('_')[0].match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d[0-5]\d[0-5]\dZ/)) {
			var clean = filename.split('_');
			var cleanname = '';
			log.debug('clean: ', clean);
			for(var j = 1; j < clean.length; j++) {
				cleanname += j+1 == clean.length ? clean[j] : clean[j] +'_'; // file.name
			}
			log.debug('cleanname: ', cleanname);
			filename = cleanname;
		}

		var videoCodec = req.body.videoCodec;
	  if(videoCodec == 'libx264' && ( format == 'mp4' || !format )) {
			format = 'mp4';
		} else if(videoCodec == 'libvpx' && ( format == 'webm' || !format )) {
			format = 'webm';
		} else if(videoCodec == 'mpeg2video' && ( format == 'mpg' || !format )) {
			format = 'mpg';
		}

	  var command = new FFmpeg('public/'+ path +'/'+ req.body.filenameOrig);
	  _renderids[rid] = command;

		// Levels audio
		if(req.body.enableAudioLevel) {
			command.withAudioFilter("volume="+req.body.volume);
	    command.withAudioChannels(req.body.channels);
			command.withAudioQuality(req.body.audioQuality);
		}
	  // Levels video
		if(req.body.enableVideoLevel) {
			command.withVideoFilter("mp=eq2="+req.body.gamma+":"+req.body.contrast+":"+req.body.brightness+":"+req.body.saturation);
		}

		// Styles audio
		if(req.body.enableAudioStyle) {
	    command.audioFilters([
	      {
	        filter: 'equalizer',
	        options: {
	          frequency: req.body.eqFrequency,
	          width_type: req.body.eqWidthType,
	          width: req.body.eqWidth,
	          gain: req.body.eqGain
	        }
	      }
	    ]);
		}
	  // Styles video
		if(req.body.keepRatio) {
			command.keepDisplayAspectRatio(req.body.keepRatio);
		}
		if(req.body.enableVideoStyle) {
			if(req.body.size) {
				if(req.body.ratio) {
					if(req.body.autopad) {
						command.size(req.body.size).aspect(req.body.ratio).autopad(req.body.autopad);
					} else {
						command.size(req.body.size).aspect(req.body.ratio);
					}
				}
				if(req.body.autopad) {
					command.size(req.body.size).autopad(req.body.autopad);
				} else {
					command.size(req.body.size);
				}
			}
		}

	  // Format audio
	  if(req.body.disableAudio) {
			command.withNoAudio();
		}
	  if(req.body.enableAudioFormat) {
			command.withAudioBitrate(req.body.bitrateAudio);
			command.withAudioFrequency(req.body.samplerate);
		}
	  // Format video
	  if(req.body.disableVideo) {
			command.withNoVideo();
		}
		if(req.body.enableVideoFormat) {
	    if(req.body.bitrateVideo) {
				command.withVideoBitrate(req.body.bitrateVideo);
			}
			if(req.body.framerate) {
				command.withOutputFps(req.body.framerate);
			}
	    if(req.body.frames) {
	  		command.withFrames(req.body.frames);
	  	}
	  }

	  command.renice(0);
	  command.setStartTime(req.body.startTimer);

	  // Presets
	  if(req.body.preset) {
	    command.preset(presets[req.body.preset]);
	  }

	  if(req.body.drawtext) {
	    var drawtext_arr = {};
	    var drawtext_options = [];
	    var drawtext_cF = [];
	    var fontfile = '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSans.ttf';

	    var drawtext = req.body.drawtext instanceof Array ? req.body.drawtext : [req.body.drawtext];
	    var coordX = req.body.drawtextCoordX instanceof Array ? req.body.drawtextCoordX : [req.body.drawtextCoordX];
	    var coordY = req.body.drawtextCoordY instanceof Array ? req.body.drawtextCoordY : [req.body.drawtextCoordY];
	    var fontcolor = req.body.fontcolor instanceof Array ? req.body.fontcolor : [req.body.fontcolor];
	    var fontsize = req.body.fontsize instanceof Array ? req.body.fontsize : [req.body.fontsize];

	    for(var opt in drawtext) {
	      var obj = {};
	      obj.options = {};
	      obj.options.fontfile = fontfile;
	      obj.options.text = drawtext[opt];
	      obj.options.x = coordX[opt] ? coordX[opt] : '(W/2)-(tw/2)';
	      obj.options.y = coordY[opt] ? coordY[opt] : '7/8*(H-lh)';
	      obj.options.fontsize = fontsize[opt] ? fontsize[opt] : 40;
	      obj.options.fontcolor = fontcolor[opt] ? fontcolor[opt] : 'white';
	      drawtext_options.push(obj);
	    }

	    drawtext_arr.options = drawtext_options;

	    // Creates complex filter array
	    for(var j in drawtext_arr.options) {
	      var index = parseInt(j) + 1;

	      // Drawtext with given option
	      var filter = {
	        filter: 'drawtext',
	        options: drawtext_arr.options[j].options,
	        inputs: [j<1 ? '0:v' : 'out'+j]
	      };

	      // Prepares output for next drawtext, but ignores last one
	      if(index != drawtext.length) {
	        filter.outputs = 'out'+index;
	      }

	      drawtext_cF.push(filter);
	    }

	    command.complexFilter(drawtext_cF);
	  }

	  // Overlay
	  if(req.body.overlay) {
	    var overlay_arr = {};
	    var overlay_options = [];
	    var overlay_cF = [];

	    var inputs = req.body.overlay instanceof Array ? req.body.overlay : [req.body.overlay];
	    var scale = req.body.overlayScale instanceof Array ? req.body.overlayScale : [req.body.overlayScale];
	    var coordX = req.body.overlayCoordX instanceof Array ? req.body.overlayCoordX : [req.body.overlayCoordX];
	    var coordY = req.body.overlayCoordY instanceof Array ? req.body.overlayCoordY : [req.body.overlayCoordY];
	    var text = req.body.overlayText instanceof Array ? req.body.overlayText : [req.body.overlayText];

	    for(var opt in inputs) {
	      var obj = {};
	      obj.scale = scale[opt] ? scale[opt] : 'iw:ih';
	      obj.coord = {};
	      obj.coord.x = coordX[opt] ? coordX[opt] : 0;
	      obj.coord.y = coordY[opt] ? coordY[opt] : 0;
	      overlay_options.push(obj);
	    }

	    overlay_arr.inputs = inputs;
	    overlay_arr.options = overlay_options;

	    // Adds new input sources
	    for(var i in overlay_arr.inputs) {
	      command.addInput(config.custom.assets+overlay_arr.inputs[i]);
	    }

	    // Creates complex filter array
	    for(var j in overlay_arr.options) {
	      var index = parseInt(j) + 1;

	      // Scales image with given option and push it into complex filter array
	      var scale = '['+index+':v]scale='+overlay_arr.options[j].scale+'[ol'+index+']';
	      overlay_cF.push(scale);

	      // Overlays image with given option and merge inputs
	      var filter = {
	        filter: 'overlay',
	        options: overlay_arr.options[j].coord,
	        inputs: [j<1 ? '0:v' : 'out'+j, 'ol'+index]
	      };

	      // Prepares output for next overlay, but ignores last one
	      if(index != overlay_arr.inputs.length) {
	        filter.outputs = 'out'+index;
	      }
	      overlay_cF.push(filter);
	    }

	    command.complexFilter(overlay_cF);
	  }

	  // Only use codecs when no filters or presets are used
	  if(!req.body.overlay && !req.body.drawtext && !req.body.preset) {
	  	command.withVideoCodec(req.body.videoCodec);
	  	command.withAudioCodec(req.body.audioCodec);
	  }

		// Fires rendering process
	  if(req.body.action == 'render') {
	    if(req.body.duration != 0) {
	      command.setDuration(req.body.duration);
	    }

	    var token = new Date().toISOString().replace(new RegExp(':', 'g'), '').substr(0, 17) +'Z_';
	    var filepath = 'data/output/';
	    filename = token + filename;
	    command.saveToFile(config.custom.output + filename +'.'+ format);
	  }

	  if(req.body.action == 'preview') {
	    command.setDuration(5);
	    var filepath = 'data/preview/';
	    filename = methods.random();
	    command.saveToFile(config.custom.preview + filename +'.'+ format);
	  }

		// Event Handlers
		command.on('progress', function(progress) {
			log.debug('%s Processing: %d% done(%dkB).', rid, progress.percent, progress.targetSize);
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      process: {
	        frames: progress.frames,
	        currentFps: progress.currentFps,
	        currentKbps: progress.currentKbps,
	        targetSize: progress.targetSize,
	        timemark: progress.timemark,
	        percent: progress.percent
	      }
	    });
		});
		command.on('codecData', function(data) {
			log.debug('%s Input is %s audio with %s video.', rid, data.audio_details, data.video_details);
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      codecData: {
	        format: data.format,
	        duration: data.duration,
	        audio: data.audio,
	        audio_details: data.audio_details,
	        video: data.video,
	        video_details: data.video_details
	      }
	    });
		});
		command.on('start', function(commandLine) {
			log.debug('%s Spawned FFmpeg with command: %s', rid, commandLine);
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      start: commandLine
	    });
		});
		command.on('filenames', function(fn) {
	    log.debug('%s Generate: %s', rid, fn.join(','));
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      filenames: fn
	    });
		});
		command.on('error', function(err) {
	    delete _renderids[rid];
			log.debug('%s An error occurred: %s', rid, err);
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      error: err.message
	    });
		});
		command.on('end', function() {
	    delete _renderids[rid];
			log.debug('%s Processing finished!', rid);
	    io.sockets.emit('stat_proc', {
	      renderid: rid,
	      end: {
	        mode: req.body.action,
	        fileid: methods.random(),
	        filename: filename,
	        filepath: filepath,
	        format: format,
	        message: req.body.action +' | Processing finished for "'+ filename +'.'+ format +'".'
	      }
	    });
		});
		res.end();
	}
}
