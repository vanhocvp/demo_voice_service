//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						
var rec; 							
var input;
var check = 1; 							

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("btnRecord");

recordButton.addEventListener("click", record);

function record() {
	if (check) {
		startRecording()
		recordButton.textContent = "Stop"
		recordButton.style.backgroundColor = "red"
		check = 0
	}
	else {
		console.log('a');
		stopRecording()
		console.log('b');
	}
}

function startRecording() {
	console.log("recordButton clicked");

    var constraints = { audio: true, video:false }

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		audioContext = new AudioContext();

		//update the format 
		// document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	// recordButton.disabled = false;
    	// stopButton.disabled = true;
    	// pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	recordButton.textContent = "Processing..."
	recordButton.style.backgroundColor = "green"
	recordButton.disabled = true
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
    // rec.getBuffer(getBufferCallback)
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls  = true;
	au.src = url;

	var xhr=new XMLHttpRequest();
	var t_start = new Date().getTime()
	xhr.onload=function(e) {
		if(this.readyState === 4) {
			var t_end = new Date().getTime()
			response = JSON.parse(e.target.responseText)
			console.log("Server returned: ",response);

			
			recordButton.disabled = false
			recordButton.textContent = "Record"
			recordButton.style.backgroundColor = "blue"
			check = 1

			audioBox.appendChild(au)

			var result = document.createElement('p');
			result.textContent = "Age: " + response["result"] + "-Time: " + (t_end-t_start)+"ms"
			audioBox.appendChild(result)
			
			
		}
	};
	var fd=new FormData();
	fd.append("file",blob, filename);
	xhr.open("POST","http://localhost:1234/api/");
//   xhr.setRequestHeader('Content-Type', 'multipart/form-data')
	console.log(fd)
	console.log(blob)
	xhr.send(fd)
}

function getBufferCallback( buffers ) {
	var newSource = audioContext.createBufferSource();
	var newBuffer = audioContext.createBuffer( 1, buffers[0].length, audioContext.sampleRate );
	newBuffer.getChannelData(0).set(buffers[0]);
	// newBuffer.getChannelData(1).set(buffers[1]);
	newSource.buffer = newBuffer;

	newSource.connect( audioContext.destination );
	newSource.start(0);
    var x = new Int8Array(buffers)
    console.log(buffers[0][0])

    var li = document.createElement('li');
    var upload = document.createElement('a');
	upload.href="#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function(event){
		  var xhr=new XMLHttpRequest();
		  xhr.onload=function(e) {
		      if(this.readyState === 4) {
		          console.log("Server returned: ",e.target.responseText);
		      }
		  };
		  var signalObj = {
              signal: x
          }
		  xhr.open("POST","http://localhost:1234/api/",true);
          xhr.setRequestHeader('Content-type', 'application/json')
		  xhr.send(JSON.stringify(signalObj));
          console.log(xhr)
	})
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
    
};