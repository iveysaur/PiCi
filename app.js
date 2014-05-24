var config = require('./config');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var swig = require('swig');
var exec = require('child_process').exec;
var app = express();
var currentStatus = '', lastUpdated = '', rawOutput = '';

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/pages');

app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.get('/', function(req, res) {
	res.render('index', { 'currentStatus': currentStatus, 'lastUpdated': lastUpdated.toString(), 'rawOutput': rawOutput });
});

app.post('/hook', function(req, res) {
	if (req.body && (req.body.after || req.body.pull_request && (req.body.after = req.body.pull_request.head.sha))) {
		console.log("checking: " + req.body.after);
		rawrOutput = '';
		sendStatus(req.body.after, 'pending', 'PiCi: Running commands.');
		var cmd = function(n) { 
			var inner = function(c) {
				exec(config.tasks[n].commands[c], function(error, stdout, stderr) {
					if (error == null) {
						if (c < config.tasks[n].commands.length - 1)
							inner(c + 1);
						else if (n < config.tasks.length - 1)
							cmd(n + 1);
						else
							sendStatus(req.body.after, 'success', 'PiCi: All commands passed.');
					}
					else {
						console.log(error);
						sendStatus(req.body.after, 'failure', 'PiCi: ' + error.toString());
					}
					rawOutput += stdout + stderr;
				});
			};
			inner(0);
		};
		cmd(0);
	}
	console.log(req.body);
	res.end();
});

function sendStatus(sha, state, message) {
	var request = https.request({ 'host': 'api.github.com', 
		'path': '/repos/' + config.repoURL + '/statuses/' + sha + '?access_token=' + config.githubToken,
		'method': 'POST',
		'headers': { 'User-Agent': 'PiCi' }}, function(res) {
			res.on('data', function(data) {
				console.log(data.toString());
			});
		});
	request.write(JSON.stringify({ 'state': state, 'description': message || '' }));
	request.end();
	currentStatus = state;
	lastUpdated = new Date();
}

app.listen(2345);

