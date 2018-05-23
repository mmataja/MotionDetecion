(function() 
{
	var video = document.getElementById('webCam');
	var vendorURL = window.URL || window.webkitURL;

	var canvasSource = document.getElementById('canvas-source');
	var canvasBlended = document.getElementById('canvas-blended');
	var contextSource = canvasSource.getContext('2d');
	var contextBlended = canvasBlended.getContext('2d');
	var timeOut, lastImageData;

	var messageArea = document.getElementById('messageArea')

	navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	navigator.getMedia({
		video: true, audio: false
		}, function(stream) {
			video.src = vendorURL.createObjectURL(stream);
			video.play();
		}, function(error) {
			//error.code
		});

	contextSource.translate(canvasSource.width, 0);
	contextSource.scale(-1, 1);

	video.addEventListener('play', function() {
		update();
	}, false);

	function update()
	{
		drawVideo();
		blend();
		checkAreas();
		setTimeout(update, 1000/60);
	}

	function drawVideo()
	{
		contextSource.drawImage(video, 0, 0, video.width, video.height);
	}

	function fastAbs(value)
	{
		//equivalent to Math.abs();
		return (value ^ (value >> 31)) - (value >> 31);
	}

	function threshold(value)
	{
		return (value > 0x15) ? 0xFF : 0;
	}

	function difference(target, data1, data2)
	{
		// blend mode difference
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
			var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
			var diff = threshold(fastAbs(average1 - average2));
			target[4*i] = diff;
			target[4*i+1] = diff;
			target[4*i+2] = diff;
			target[4*i+3] = 0xFF;
			i++;
		}
	}

	function blend()
	{
		var width = canvasSource.width;
		var height = canvasSource.height;
		// webcam image data
		var sourceData = contextSource.getImageData(0, 0, width, height);
		// create an image if the previus image doesn't exist
		if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
		// create a ImageData instance to recieve the blended result
		var blendedData = contextSource.createImageData(width, height);
		// blend 2 images
		difference(blendedData.data, sourceData.data, lastImageData.data);
		// draw the result in canvas
		contextBlended.putImageData(blendedData, 0, 0);
		// store the current webcam image
		lastImageData = sourceData;
	}

	function checkAreas()
	{
		var checkBlendedUp = contextBlended.getImageData(175, 0, 50, 50);
		var checkBlendedDown = contextBlended.getImageData(175, 250, 50, 50);
		var checkBlendedLeft = contextBlended.getImageData(0, 125, 50, 50);
		var checkBlendedRight = contextBlended.getImageData(350, 125, 50, 50);

		var jUp = 0;
		var jDown = 0;
		var jLeft = 0;
		var jRight = 0;

		var sumUp = 0;
		var sumDown = 0;
		var sumLeft = 0;
		var sumRight = 0;

		var countPixelsUp = checkBlendedUp.data.length * 0.25;
		var countPixelsDown = checkBlendedDown.data.length * 0.25;
		var countPixelsLeft = checkBlendedLeft.data.length * 0.25;
		var countPixelsRight = checkBlendedRight.data.length * 0.25;

		while (jUp < countPixelsUp) {
			sumUp += (checkBlendedUp.data[4*jUp] + checkBlendedUp.data[4*jUp+1] + checkBlendedUp.data[4*jUp+2]);
			jUp++;
		}
		while (jDown < countPixelsDown) {
			sumDown += (checkBlendedDown.data[4*jDown] + checkBlendedDown.data[4*jDown+1] + checkBlendedDown.data[4*jDown+2]);
			jDown++;
		}
		while (jLeft < countPixelsLeft) {
			sumLeft += (checkBlendedLeft.data[4*jLeft] + checkBlendedLeft.data[4*jLeft+1] + checkBlendedLeft.data[4*jLeft+2]);
			jLeft++;
		}
		while (jRight < countPixelsRight) {
			sumRight += (checkBlendedRight.data[4*jRight] + checkBlendedRight.data[4*jRight+1] + checkBlendedRight.data[4*jRight+2]);
			jRight++;
		}

		var averageUp = Math.round(sumUp / (3 * countPixelsUp));
		var averageDown = Math.round(sumDown / (3 * countPixelsDown));
		var averageLeft = Math.round(sumLeft / (3 * countPixelsLeft));
		var averageRight = Math.round(sumRight / (3 * countPixelsRight));

		if (averageUp > 10) {
			messageArea.innerHTML = "<font color=red> Go Up. </font>";
		} else if (averageDown > 20) {
			messageArea.innerHTML = "<font color=black> Go Down </font>";
		} else if (averageLeft > 10) {
			messageArea.innerHTML = "<font color=blue> Go left </font>";
		} else if (averageRight > 10) {
			messageArea.innerHTML = "<font color=green> Go right </font>";
		} else {
			messageArea.innerHTML = "<font color=black>!!!                !!!</font>"
		}
	}

})();