var express = require('express');
var fs = require('fs');
var app = express();
var log = require('./log.js');
var bodyParser = require('body-parser');
var path = require('path');

workDir = process.env.WORK_DIR || "/opt/mirror/";

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.raw({ type: 'audio/webm', limit: '50mb' }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  }
  else {
    next();
  }
});

app.post('/emo', function (req, res) {
  var iPerson = req.query.username ? req.query.username : 'all';
  var base64Data = req.body.image.toString().replace(/^data:image\/jpeg;base64,/, "");
  var image = new Buffer(base64Data, 'base64');
  var result = "";

  fs.mkdtemp(path.join(workDir,'image-'), (err, folder) => {
    if (err) log.crit(`image folder error: ${err}`);

    fs.writeFile(folder + "/new.jpg", image, 'base64', function (err) {
      if (err) log.crit(`image file write error: ${err}`);
    });

    const exec = require('child_process').exec;
    var command = 'face_recognition ' + workDir + 'known/' + iPerson + ' ' + folder + '/new.jpg --show-distance 1 | cut -d \',\' -f2-3';
    exec(command, (error, stdout, stderr) => {
      if (error) log.crit(`face_recognition error: ${error}`);
      const output = stdout.split(',');
      log.info(stdout);
      procenat = Math.abs(90 + ((1 - output[1]) * 10)).toFixed(2);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(result.concat(output[0], "(", procenat, "%)"));

      deleteFolderRecursive(folder);
    });
  });
});

app.post('/image', function (req, res) {
  var iPerson = req.query.username ? req.query.username : 'all';
  var base64Data = req.body.image.toString().replace(/^data:image\/jpeg;base64,/, "");
  var image = new Buffer(base64Data, 'base64');
  var result = "";

  fs.mkdtemp(path.join(workDir,'image-'), (err, folder) => {
    if (err) log.crit(`image folder error: ${err}`);

    fs.writeFile(folder + "/new.jpg", image, 'base64', function (err) {
      if (err) log.crit(`image file write error: ${err}`);
    });

    const exec = require('child_process').exec;
    var command = 'face_recognition ' + workDir + 'known/' + iPerson + ' ' + folder + '/new.jpg --show-distance 1 | cut -d \',\' -f2-3';
    exec(command, (error, stdout, stderr) => {
      if (error) log.crit(`face_recognition error: ${error}`);
      const output = stdout.split(',');
      log.info(stdout);
      procenat = Math.abs(90 + ((1 - output[1]) * 10)).toFixed(2);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(result.concat(output[0], "(", procenat, "%)"));

      deleteFolderRecursive(folder);
    });
  });
});

app.post('/audio', function (req, res) {
  app.use(bodyParser.raw({ type: 'audio/wav' }));
  var audio = req.body;

  fs.mkdtemp(path.join(workDir,'audio-'), (err, folder) => {
    if (err) log.crit(`audio dir create error: ${err}`);

    fs.writeFile(folder + "/new.webm", audio, 'base64', function (err) {
      if (err) log.crit(`audio file write error: ${err}`);
    });
    const exec = require('child_process').exec;
    const exec1 = require('child_process').exec;

    var command = 'ffmpeg -i ' + folder + '/new.webm -y -acodec pcm_s16le -ac 1 -ar 16000 -af lowpass=3000,highpass=200 -vn ' + folder + '/new.wav';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.crit(`ffmpeg exec error: ${error}`);
        return;
      }
    });

    var command = 'deepspeech --model ' + workDir + 'deepspeech-0.6.0-models/output_graph.pbmm --lm ' + workDir + 'deepspeech-0.6.0-models/lm.binary --trie ' + workDir + 'deepspeech-0.6.0-models/trie --audio ' + folder + '/new.wav';
    exec1(command, (error, stdout, stderr) => {
      if (error) {
        log.crit(`deepspeech exec error: ${error}`);
        return;
      }
      log.info(stdout);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(stdout);
      deleteFolderRecursive(folder);
    });
  });
});

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

port = process.env.NODE_PORT || 3000;
app.listen(port);
log.info("Mirror listening at http://localhost:" + port);
