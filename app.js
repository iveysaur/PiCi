var express = require('express'), app = express();

app.get('/', function(req, res){
	res.send('PiCi');
});

app.listen(2345);

