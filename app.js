var express = require('express'), app = express(), swig = require('swig');
var bodyParser = require('body-parser');
var https = require('https'), config = require('./config');

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
	if (req.body && req.body.after) {
		console.log("checking: " + req.body.after);
		var request = https.request({ 'host': 'api.github.com', 
			'path': '/repos/' + config.repoURL + '/status/' + req.body.after + '?access_token=' + config.githubToken,
			'method': 'POST'}, function(res) {
				res.on('data', function(data) {
					console.log(data);
				});
			});
		request.write(JSON.stringify({ 'state': 'pending' }));
		request.end();
	}
	res.end();
});

app.listen(2345);

