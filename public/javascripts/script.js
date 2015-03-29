// Shows files to upload after fileselect
$(document).on('change', '.btn-file :file', function() {
	var input = $(this);
	var numFiles = input.get(0).files ? input.get(0).files.length : 1;
	var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');

	input.trigger('fileselect', [numFiles, label]);
});

$(function() {
	// Loads tooltip library
  $('[data-toggle="tooltip"]').tooltip();

	// Loads selectpicker library
	$('.selectpicker').selectpicker();

	// Sets default range values
	$('.rangeValue').text(function() {
		$(this).text(delimiter($(this).text()));
	});

	// Duration of the messages before they disappear
	setTimeout(function() {
		$('.messages').find('div').fadeOut('slow', 'swing');
	}, 15000);
	// Messages immediately disappear
	$('.messages').find('a').on('click', function() {
		$(this).parent().fadeOut('slow', 'swing');
	});
});



$(document).ready( function() {
	// Fileselect routine for file upload
	$('.btn-file :file').on('fileselect', function(event, numFiles, label) {
		var input = $(this).parents('.input-group').find(':text');
		var log = numFiles > 1 ? numFiles + ' files selected' : label;

		if(input.length) {
			input.val(log);
		} else {
			if(log) alert(log);
		}
	});

	// Update video source
	$('.update').on('click', function() {
		$(this).find('form').submit();
	});

	// Delete video source
	$('.delete').on('click', function() {
		$(this).find('form').submit();
	});

	// Gets the source address
	$('.url').text(document.URL);

	// Sets range value on mouse move
	$('.form-group').find('.range').mousemove(function() {
		$(this).parent().find('.rangeValue').text(delimiter($(this).val()));
	});

	// Appends and submit form data for render process
	$('#render').on('click', function() {
		var fd = new FormData();
		fd.append('action', 'render');

		$('.settings').serializeArray().forEach(function(field) {
			fd.append(field.name, field.value);
		});

		submit(fd, '/render');

		// Search style tab and switch the view
		$('a').each(function() {
			if($(this).attr('href') == '#console') {
				$(this).click();
			}
		});
	});

	// Appends and submit form data for preview
	$('#preview').on('click', function() {
		var fd = new FormData();
		fd.append('action', 'preview');

		$('.settings').serializeArray().forEach(function(field) {
			fd.append(field.name, field.value);
		});

		submit(fd, '/render');

		// Search style tab and switch the view
		$('a').each(function() {
			if($(this).attr('href') == '#console') {
				$(this).click();
			}
		});
	});

	// Selects only one overlay image
	$('#overlay').find('.overlayImg').on('click', function() {
		$('.overlayImg').each(function() {
			$(this).css('background-color', 'white');
		});

		if($(this).css('background-color') == 'rgb(173, 216, 230)') {
			$(this).css('background-color', 'white');
			$('#overlay').find('[name="overlay"]').val('');
		} else {
			var tmp = $(this).find('.overlayName').text().split('/');
			$(this).css('background-color', 'lightblue');
			$('#overlay').find('[name="overlay"]').val(tmp[tmp.length-1]);
		}
	});



	// Clean console from input
	$('#resetConsole').on('click', function() {
		$('#console').find('tbody').empty();
	});



	var mediaUpdate = false;
	if($('#media').length > 0) {
		// Gets duration directly from the media source
		$('#media')[0].oncanplay = function() {
			var duration = delimiter($(this)[0].duration);
			if(duration && !mediaUpdate) {
				$('.time').find('.text-right').text(delimiter(duration));
				$('.time').find('.range').attr('max', duration);
				$('#duration').find('.rangeValue').text(delimiter(duration));
				$('#duration').find('.range').val(duration);
				mediaUpdate = true;
			}
		}

		// Sets begin time
		$('#beginTime').click(function() {
			var currentTime = delimiter($('#media')[0].currentTime);
			$('#startTimer').find('.rangeValue').text(delimiter(currentTime));
			$('#startTimer').find('.range').val(currentTime);
			$('#beginTime').text('Start:  ' + delimiter(currentTime) + 's');

			// Search style tab and switch the view
			$('a').each(function() {
				if($(this).attr('href') == '#style') {
					$(this).click();
				}
			});
		});

		// Sets end time
		$('#endTime').click(function() {
			var currentTime = delimiter($('#media')[0].currentTime);
			var duration = currentTime - $('#startTimer').find('.range').val();
			$('#duration').find('.rangeValue').text(delimiter(duration));
			$('#duration').find('.range').val(duration);
			$('#endTime').text('End:  ' + delimiter(currentTime) + 's');

			// Search style tab and switch the view
			$('a').each(function() {
				if($(this).attr('href') == '#style') {
					$(this).click();
				}
			});
		});

		// Resets time
		$('#resetTime').click(function() {
			$('#startTimer').find('.rangeValue').text(0);
			$('#startTimer').find('.range').val(0);
			$('#duration').find('.rangeValue').text(0);
			$('#duration').find('.range').val(0);
			$('#beginTime').text('Start');
			$('#endTime').text('End');
		});
	}
});



// Handles images if error event triggers
function loadImg(s) {
	$(s).after($('<p>File can not be shown.</p>'));
	$(s).remove();
}

// Cuts the float
function delimiter(n) {
	return n;
}

// Deletes video items in console
function deleteOutput(id, dir) {
	if(confirm("Are you sure you want to submit?")) {
		var rid = $('[name=rid]').val();
		var fd = new FormData();
		fd.append('delete', dir);

		$('#'+ rid).find('.'+ id).remove();

		submit(fd, '/delete');
	}
}

// Ajax submit
function submit(fd, action) {
	$.ajax({
		url: action,
		type: 'POST',
		data: fd,
		async: true,
		cache: false,
		contentType: false,
		processData: false,
		success: function (data) {

    },
		error: function(xhr, text, desc) {
			console.log('Ajax Error: Text: %s | Status: %s | Description: %s', text, xhr.status, desc);
		}
	});

	return false;
}
