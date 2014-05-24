var express = require('express'), app = express(), swig = require('swig');
var bodyParser = require('body-parser');
var https = require('https'), config = require('./config');
var exec = require('child_process').exec, child;

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/pages');

app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.get('/', function(req, res) {
	res.render('index', { 'foo': 'hi' });
});

app.post('/hook', function(req, res) {
	if (req.body && (req.body.after || req.body.pull_request && (req.body.after = req.body.pull_request.head.sha))) {
		console.log("checking: " + req.body.after);
		sendStatus(req.body.after, 'pending', 'PiCi: Running commands.');
		var i = 0;
		var cmd = function(n) { 
			var inner = function(c) {
				child = exec(config.tasks[n].commands[c], function(error, stdout, stderr) {
					if (error == null) {
						if ((c + 1) < config.tasks[n].commands.length) {
							inner(c + 1);
						}
						else if ((n + 1) < config.tasks.length) {
							cmd(n + 1);
						}
						else {
							sendStatus(req.body.after, 'passed', 'PiCi: All commands passed.');
						}
					}
					else {
						console.log(error);
						sendStatus(req.body.after, 'failure', 'PiCi: ' + error.toString());
					}
				});
			}
			inner(n);
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
}

app.listen(2345);

