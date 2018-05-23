var video = document.getElementById('webCam');
var vendorURL = window.URL || window.webkitURL;

var canvasSource = document.getElementById('canvas-source');
var canvasBlended = document.getElementById('canvas-blended');
var contextSource = canvasSource.getContext('2d');
var contextBlended = canvasBlended.getContext('2d');
var timeOut, lastImageData;

var messageArea = document.getElementById('messageArea')

var start = new Date().getTime();
var elapsed = new Date().getTime() - start;

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
	//
}, false);

var canvas, canvasContext;

var checkIfTrackLoaded = false;

window.onload = function() {
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');

	loadLevel(trackGridLevels[levelCounter]);

	if (checkIfTrackLoaded == true){
		startGame();	
	} else {
		loadLevel(trackGridLevels[levelCounter]);
	}
	
}

function startGame(){
	var framesPerSecond = 30;
	setInterval(updateAll, 1000/framesPerSecond);

	setupInput();

	carImageLoad();

	carReset();
}

function loadLevel(levelNumber){
	trackGrid = levelNumber.slice();
	carReset();
	checkIfTrackLoaded = true;
	console.log("wall Hits: ", wallCounter);
	console.log("Time: ", c, "seconds")
}

function updateAll() {
 
	moveAll();
	drawAll();

	drawVideo();
	blend();
	checkAreas();
}

function moveAll() {
	carMove();
	carTrackHandling();
}

function clearScreen() {
	colorRect(0,0, canvas.width,canvas.height, 'black');
}

function drawAll() {
	clearScreen();

	carDraw();

	drawTracks();
}

//-----------------------------------------------------------------------------------------

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
	//draw 4 rectangles
	contextBlended.rect(0, 0, 65, 55); // left
	contextBlended.strokeStyle="red";
	contextBlended.stroke();
	contextBlended.rect(335, 0, 65, 55); // right
	contextBlended.strokeStyle="red";
	contextBlended.stroke();
	contextBlended.rect(170, 0, 65, 55); // up
	contextBlended.strokeStyle="red";
	contextBlended.stroke();
	contextBlended.rect(0, 235, 65, 55); // down
	contextBlended.strokeStyle="red";
	contextBlended.stroke();

	var checkBlendedUp = contextBlended.getImageData(170, 0, 65, 55);
	var checkBlendedDown = contextBlended.getImageData(0, 240, 65, 55);
	var checkBlendedLeft = contextBlended.getImageData(0, 0, 65, 55);
	var checkBlendedRight = contextBlended.getImageData(335, 0, 65, 55);

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
		if (loadingCheck == false){
			loadingCheck = true;
		} else {
			keyHeld_Gas = true;
			startCount();
		}	
	} else if (averageDown > 10) {
		keyHeld_Reverse = true;
		startCount();
	} else if (averageLeft > 10) {
		keyHeld_TurnLeft = true;
		startCount();
	} else if (averageRight > 10) {
		keyHeld_TurnRight = true;
		startCount();
	} else {
		keyHeld_Gas = false;
		keyHeld_TurnLeft = false;
		keyHeld_TurnRight = false;
		keyHeld_Reverse = false;
	}
}

var loadingCheck = false;

var c = 0;
var t;
var timer_is_on = 0;

function timedCount() {
    //document.getElementById("txt").value = c;
    c = c + 1;
    t = setTimeout(function(){ timedCount() }, 1000);
}

function startCount() {
    if (!timer_is_on) {
        timer_is_on = 1;
        timedCount();
    }
}

function stopCount() {
    clearTimeout(t);
    timer_is_on = 0;
}