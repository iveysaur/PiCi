var express = require('express'), app = express(), swig = require('swig');

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/pages');

app.set('view cache', false);
swig.setDefaults({ cache: false });

app.get('/', function(req, res){
	res.render('index', { 'foo': 'hi' });
});

app.listen(2345);

