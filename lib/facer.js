/*'use strict';*/

var mediaRecorder;
var recordedBlobs;

// var isSecureOrigin = location.protocol === 'https:' || location.hostname === 'localhost';
// if (!isSecureOrigin) {
//   alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
//     '\n\nChanging protocol to HTTPS');
//   location.protocol = 'HTTPS';
// }

var constraints = {
  video: true,
  audio: {
    contentType: 'audio/webm; codecs=pcm',
    channels: '1',
    bitrate: 16000,
    samplerate: 16000
  }
};

function getStream(constr) {
  return new Promise(function(resolve, reject) {
    navigator.mediaDevices.getUserMedia(constr)
    .then(stream => {
      resolve(stream);
    })
    .catch(error => {
      console.error('Error accessing media devices.', error);
      reject(error);
    });
  });
}

function poll() {
  let localVideo = document.getElementById("localVideo");
  let localCanvas = document.getElementById("localCanvas");
  var w = localVideo.videoWidth;
  var h = localVideo.videoHeight;
  var canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(localVideo, 0, 0, w, h);
  var image = canvas.toDataURL('image/jpeg');
  //post an image
  sendImageToServer(image);

  var comp = ccv.detect_objects({ "canvas" : ccv.grayscale(canvas),
                                "cascade" : cascade,
                                "interval" : 5,
                                "min_neighbors" : 1 });
  /* draw detected area */
  localCanvas.width = localVideo.clientWidth;
  localCanvas.height = localVideo.clientHeight;
  var ctx2 = localCanvas.getContext('2d');
  ctx2.lineWidth = 2;
  ctx2.lineJoin = "round";
  ctx2.clearRect (0, 0, localCanvas.width,localCanvas.height);
  var x_offset = 0, y_offset = 0, x_scale = 1, y_scale = 1;
  if (localVideo.clientWidth * localVideo.videoHeight > localVideo.videoWidth * localVideo.clientHeight) {
    x_offset = (localVideo.clientWidth - localVideo.clientHeight *
                localVideo.videoWidth / localVideo.videoHeight) / 2;
  } else {
    y_offset = (localVideo.clientHeight - localVideo.clientWidth *
                localVideo.videoHeight / localVideo.videoWidth) / 2;
  }
  x_scale = (localVideo.clientWidth - x_offset * 2) / localVideo.videoWidth;
  y_scale = (localVideo.clientHeight - y_offset * 2) / localVideo.videoHeight;
  for (var i = 0; i < comp.length; i++) {
    comp[i].x = comp[i].x * x_scale + x_offset;
    comp[i].y = comp[i].y * y_scale + y_offset;
    comp[i].width = comp[i].width * x_scale;
    comp[i].height = comp[i].height * y_scale;
    var opacity = 0.1;
    if (comp[i].confidence > 0) {
      opacity += comp[i].confidence / 10;
      if (opacity > 1.0) opacity = 1.0;
    }
    //ctx2.strokeStyle = "rgba(255,0,0," + opacity * 255 + ")";
    ctx2.lineWidth = opacity * 10;
    ctx2.strokeStyle = "rgb(255,0,0)";
    ctx2.strokeRect(comp[i].x, comp[i].y, comp[i].width, comp[i].height);
  }
  setTimeout(poll, 5000);
};

function sendImageToServer(base64) {
  var namelabel = document.getElementById("namelabel");
  var httpPost = new XMLHttpRequest(),
      path = "http://localhost:8082/image",
      data = JSON.stringify({image: base64});
  httpPost.onreadystatechange = function(err) {
      if (httpPost.readyState == XMLHttpRequest.DONE) {
          console.log(httpPost.responseText);
          namelabel.textContent = "Name: " + httpPost.responseText;
      } else {
          // console.log("HTTP request failed, status: ", httpPost.status);
      }
  };
  httpPost.open("POST", path, true);
  httpPost.setRequestHeader('Content-Type', 'application/json');
  httpPost.send(data);
}

function sendAudioToServer(blob) {
    // var audiolabel = document.getElementById('audiolabel')
    var httpPost = new XMLHttpRequest(),
      path = "http://localhost:8082/audio",
      data = blob;
    httpPost.onreadystatechange = function(err) {
        if (httpPost.readyState == XMLHttpRequest.DONE) {
            console.log(httpPost.responseText);
            if(String(httpPost.responseText) != "") {
              audiolabel.textContent = 'Said: ';
              audiolabel.textContent += httpPost.responseText;
              startRecording();
            } else {
              console.log("httpPost.responseText is empty");
            }
        } else {
            // console.log("HTTP request failed, status: ", httpPost.status);
        }
    };
    httpPost.open("POST", path, true);
    httpPost.setRequestHeader('Content-Type', 'audio/webm');
    httpPost.send(data);
}

function stopAudio() {
  mediaRecorder.stop();
  //console.log('Recorded Blobs: ', recordedBlobs);
  var superBuffer = new Blob(recordedBlobs, {type: 'audio/webm'});
  sendAudioToServer(superBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  audiolabel.style.color = "green";
  // console.log('MediaRecorder stopped'); //: ', event);
  //mediaRecorder.start(100);
}

function startRecording() {
  var audiolabel = document.getElementById("audiolabel");
  recordedBlobs = [];
  var options = {mimeType: 'audio/webm;codecs=opus'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log("Mime type not supperted: ", options.mimeType);
    options = {mimeType: 'audio/webm'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log("Mime type not supperted: ", options.mimeType);
      options = {mimeType: ''};
    }
  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ', e);
    alert('Exception while creating MediaRecorder: '
      + e + '. mimeType: ' + options.mimeType);
    return;
  }
  //console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  audiolabel.style.color = "red";
  mediaRecorder.start(10);
  // console.log('MediaRecorder started'); //, mediaRecorder);
  setTimeout(stopAudio, 5000);
}

stream = getStream(constraints)
  .then((stream) => {
    console.log(stream);
    let video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.setAttribute('id', 'localVideo');
    video.srcObject = stream;
    window.stream = stream;
    document.getElementById("media").appendChild(video);
  })
  .catch(error => {
    console.log("Media strema error: ", error);
    document.getElementById("audiolabel").remove();
    document.getElementById("namelabel").remove();
    var label = document.createElement('label');
    label.textContent = error;
    label.style.color = "white";
    document.getElementById("text").appendChild(label);
  });

  const observer = new MutationObserver((mutations, obs) => {
    let video = document.getElementById('localVideo');
    if (video) {
      poll();
      startRecording();
      obs.disconnect();
      return;
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
