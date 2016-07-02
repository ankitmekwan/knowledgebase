
var http = require('http');
var express = require('express');
var subdomain  = require('express-subdomain-handler');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var app = express();

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.use(subdomain({ base : 'localhost', removeWWW : true }));
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

// build mongo database connection url //
var connection_string = 'mongodb://127.0.0.1:27017/knowledgebase';
if(process.env.MONGODB_URI){
  connection_string = process.env.MONGODB_URI;
}

app.use(session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ url: connection_string })
	})
);

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

require('./app/server/routes')(app);
