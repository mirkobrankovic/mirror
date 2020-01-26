var express = require('express');
var fs = require('fs');
var app = express();

var bodyParser = require('body-parser')
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.raw({ type: 'audio/webm', limit: '50mb' }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  }
  else {
    next();
  }
});

app.post('/image', function (req, res) {
  var iPerson = req.query.username ? req.query.username : 'all';
  var base64Data = req.body.image.toString().replace(/^data:image\/jpeg;base64,/, "");
  var image = new Buffer(base64Data, 'base64');
  var result = "";

  fs.mkdtemp('image-', (err, folder) => {
    if (err) throw err;

    fs.writeFile(folder + "/new.jpg", image, 'base64', function (err) {
      if (err) {
        console.log(err);
      }
    });

    const exec = require('child_process').exec;
    var command = '/home/infobip/.local/bin/face_recognition known/' + iPerson + ' ' + folder + '/new.jpg --show-distance 1 | cut -d \',\' -f2-3';
    exec(command, (error, stdout, stderr) => {
      if (error) throw err;
      const output = stdout.split(',');
      console.log(`face_recognition stdout: ${stdout}`);
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

  fs.mkdtemp('audio-', (err, folder) => {
    if (err) throw err;

    require("fs").writeFile(folder + "/new.webm", audio, 'base64', function (err) {
      if (err) {
        console.log(err);
      }
    });
    const exec = require('child_process').exec;
    const exec1 = require('child_process').exec;

    exec('ffmpeg -i ' + folder + '/new.webm -y -acodec pcm_s16le -ac 1 -ar 16000 -af lowpass=3000,highpass=200 -vn ' + folder + '/new.wav', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      //console.log(`stderr: ${stderr}`);
    });

    exec1('deepspeech --model deepspeech-0.6.0-models/output_graph.pbmm --lm deepspeech-0.6.0-models/lm.binary --trie deepspeech-0.6.0-models/trie --audio ' + folder + '/new.wav', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`Deepspeach stdout: ${stdout}`);

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

port = 3000;
app.listen(port);
console.log('Listening at http://localhost:' + port)
