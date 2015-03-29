var socket = io();

// Renice
$('.qreniceup').on('click', function() {
	var getNiceness = Number($(this).closest('tr').find('.niceness').text());
	var setNiceness = getNiceness == -20 ? -20 : getNiceness - 1;
	socket.emit('reniceup_proc', $(this).closest('tr').attr('id'));
	$(this).closest('tr').find('.niceness').text(setNiceness);
	return false;
});
$('.qrenicedown').on('click', function() {
	var getNiceness = Number($(this).closest('tr').find('.niceness').text());
	var setNiceness = getNiceness == 20 ? 20 : getNiceness + 1;
	socket.emit('renicedown_proc', $(this).closest('tr').attr('id'));
	$(this).closest('tr').find('.niceness').text(setNiceness);
	return false;
});

// Emits SIGKILL to FFmpeg to halt the render process
$('[id^=sigstop]').on('click', function() {
	socket.emit('stop_proc', $('[name=rid]').val());
	return false;
});
$('.qsigstop').on('click', function() {
	socket.emit('stop_proc', $(this).closest('tr').attr('id'));
	return false;
});
$('#allSigstop').on('click', function() {
	socket.emit('stop_proc', 'sigstopall');
	return false;
});

// Emits SIGKILL to FFmpeg to continue the render process
$('[id^=sigcont]').on('click', function() {
	socket.emit('cont_proc', $('[name=rid]').val());
	return false;
});
$('.qsigcont').on('click', function() {
	socket.emit('cont_proc', $(this).closest('tr').attr('id'));
	return false;
});
$('#allSigcont').on('click', function() {
	socket.emit('cont_proc', 'sigcontall');
	return false;
});

// Emits SIGKILL to FFmpeg to terminate the render process
$('[id^=sigkill]').on('click', function() {
	socket.emit('kill_proc', $('[name=rid]').val());
	return false;
});
$('.qsigkill').on('click', function() {
	socket.emit('kill_proc', $(this).closest('tr').attr('id'));
	return false;
});
$('#allSigkill').on('click', function() {
	socket.emit('kill_proc', 'sigkillall');
	return false;
});

socket.on('stat_proc', function(data) {

	// Get current render id
	var rid = data.renderid;
	var timestamp = new Date().toISOString().substr(0, 11) + new Date().toLocaleTimeString();

	// FFmpeg emits render process states and appends it to the console
	if(data.info) {
		$('#console').find('#'+rid).prepend($('<tr class="bg-info"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">Render process Information:</p><pre class="log-message breakall">'+data.info+'</pre></td></tr>'));
		// Show queue status for info event
		$('#queue').find('#'+rid).attr('class', 'info');
	}
	if(data.start) {
		$('#console').find('#'+rid).prepend($('<tr class="bg-primary"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">Spawned FFmpeg with command:</p><pre class="log-message breakall">'+data.start+'</pre></td></tr>'));
	}
	if(data.codecData) {
		$('#console').find('#'+rid).prepend($('<tr class="bg-info"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">Format: '+data.codecData.format+' | Duration: '+data.codecData.duration+'<br>Audio: '+data.codecData.audio+' (Codec: '+data.codecData.audio_details+')<br>Video: '+data.codecData.video+' (Codec: '+data.codecData.video_details+')</p></td></tr>'));
	}
	if(data.process) {
		var qprogress = data.process.percent.toLocaleString();
		// Some browsers do not show a progress bar if the delimiter is a comma.
		qprogress = qprogress.replace(/,/g, '.');
		$('#console').find('#'+rid).prepend($('<tr class="bg-warning"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">'+data.process.percent.toLocaleString()+'% | '+data.process.targetSize+'kB | Frames: '+data.process.frames+' | FPS: '+data.process.currentFps+' | Bitrate: '+data.process.currentKbps+' | Time: '+data.process.timemark+'</p></td></tr>'));
		// Show queue status for process event
		$('#queue').find('#'+rid).attr('class', 'active');
		// Generates render process bar
		$('#queue').find('#'+rid+' td:nth-last-child(1)').replaceWith($(
			'<td><div class="progress" style="margin-bottom: 0;">'+
			  '<div class="progress-bar" role="progressbar" aria-valuenow="'+qprogress+'"'+
			  'aria-valuemin="0" aria-valuemax="100" style="width:'+qprogress+'%; color: #333333;"><p>'+
			    qprogress+'%'+
			  '</p></div>'+
			'</div></td>'
		));
		$('[id^=sig]').prop('disabled', false);
	}
	if(data.error) {
		$('[id^=sig]').prop('disabled', true);
		$('#console').find('#'+rid).prepend($('<tr class="bg-danger"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">An error occurred:<pre class="log-message breakall">'+data.error+'</pre></td></tr>'));
		// Show queue status for error event
		$('#queue').find('#'+rid).attr('class', 'danger');
	}
	if(data.end) {
		var mediaId = data.end.fileid;
		var mediaDir = data.end.filepath + data.end.filename +'.'+ data.end.format;

		$('[id^=sig]').prop('disabled', true);
		$('#console').find('#'+rid).prepend($('<tr class="bg-success"><td><p class="log-timestamp">'+timestamp+'</p></td><td><p class="log-message breakall">'+data.end.message+'</p></td></tr>'));
		// Show queue status for end event
		$('#queue').find('#'+rid).attr('class', 'success');

		if(data.end.format == 'mp4' ||  data.end.format == 'webm' || data.end.format == 'ogg') {
			$('#console').find('#'+rid).prepend($(
				'<tr class="'+mediaId+' bg-warning"><td><p class="log-timestamp">'+timestamp+'</p></td><td>'+
					'<form role="form" action="javascript:;" method="post" enctype="multipart/form-data">'+
						'<input class="form-control" type="hidden" name="delete" value="'+mediaDir+'">'+
						'<video controls>'+
							'<source src="'+mediaDir+'" type="video/mp4">'+
							'<source src="'+mediaDir+'" type="video/webm">'+
							'<source src="'+mediaDir+'" type="video/ogg">'+
							'Your browser does not support the audio element.'+
						'</video>'+

						'<div class="btn-group btn-group-xs">'+
							'<a href="'+mediaDir+'" title="Permalink" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-link"></span></a>'+
							'<a href="'+mediaDir+'" title="Download" download="" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-download-alt"></span></a>'+
							"<button type='submit' title='Delete' class='delete btn btn-danger' onclick=\"javascript:deleteOutput('"+mediaId+"','"+mediaDir+"');\">"+
								'<span class="glyphicon glyphicon-trash"></span></button>'+
					'</form></td></tr>'
			));
		} else if(data.end.format == 'mp3' ||  data.end.format == 'wav' || data.end.format == 'ogg') {
			$('#console').find('#'+rid).prepend($(
				'<tr class="'+mediaId+' bg-warning"><td><p class="log-timestamp">'+timestamp+'</p></td><td>'+
					'<form role="form" action="javascript:;" method="post" enctype="multipart/form-data">'+
						'<input class="form-control" type="hidden" name="delete" value="'+mediaDir+'">'+
						'<audio controls>'+
							'<source src="'+mediaDir+'" type="audio/mpeg">'+
							'<source src="'+mediaDir+'" type="audio/ogg">'+
							'<source src="'+mediaDir+'" type="audio/wav">'+
							'Your browser does not support the audio element.'+
						'</audio></form>'+
						'<div class="btn-group btn-group-xs">'+
							'<a href="'+mediaDir+'" title="Permalink" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-link"></span></a>'+
							'<a href="'+mediaDir+'" title="Download" download="" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-download-alt"></span></a>'+
							"<button type='submit' title='Delete' class='delete btn btn-danger' onclick=\"javascript:deleteOutput('"+mediaId+"','"+mediaDir+"');\">"+
								'<span class="glyphicon glyphicon-trash"></span></button>'+
					'</form></td></tr>'
			));
		} else if(data.end.format == 'png' ||  data.end.format == 'jpg' || data.end.format == 'jpeg' || data.end.format == 'gif' || data.end.format == 'bmp' || data.end.format == 'tif' || data.end.format == 'tiff' || data.end.format == 'eps') {
			$('#console').find('#'+rid).prepend($(
				'<tr class="'+mediaId+' bg-warning"><td><p class="log-timestamp">'+timestamp+'</p></td><td>'+
					'<form role="form" action="javascript:;" method="post" enctype="multipart/form-data">'+
						'<input class="form-control" type="hidden" name="delete" value="'+mediaDir+'">'+
						'<img src="'+mediaDir+'"  onerror="loadImg(this);">'+
						'<div class="btn-group btn-group-xs">'+
							'<a href="'+mediaDir+'" title="Permalink" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-link"></span></a>'+
							'<a href="'+mediaDir+'" title="Download" download="" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-download-alt"></span></a>'+
							"<button type='submit' title='Delete' class='delete btn btn-danger' onclick=\"javascript:deleteOutput('"+mediaId+"','"+mediaDir+"');\">"+
								'<span class="glyphicon glyphicon-trash"></span></button>'+
					'</form></td></tr>'
			));
		} else {
			$('#console').find('#'+rid).prepend($(
				'<tr class="'+mediaId+' bg-warning"><td><p class="log-timestamp">'+timestamp+'</p></td><td>'+
					'<form role="form" action="javascript:;" method="post" enctype="multipart/form-data">'+
						'<input class="form-control" type="hidden" name="delete" value="'+mediaDir+'">'+
						'<p>File format "'+ data.end.format +'" can not be shown. Probably not supported?</p>'+
						'<div class="btn-group btn-group-xs">'+
							'<a href="'+mediaDir+'" title="Permalink" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-link"></span></a>'+
							'<a href="'+mediaDir+'" title="Download" download="" class="btn btn-default">'+
								'<span class="glyphicon glyphicon-download-alt"></span></a>'+
							"<button type='submit' title='Delete' class='delete btn btn-danger' onclick=\"javascript:deleteOutput('"+mediaId+"','"+mediaDir+"');\">"+
								'<span class="glyphicon glyphicon-trash"></span></button>'+
				'</form></td></tr>'
			));
		}
	}
});
