/**
 * Created by sewonpark on 2016-02-01.
 */
var express = require('express');

var app = express();

var fortune = require('../lib/fortune.js');

//Handlebars
var handlebars = require('express-handlebars').create({ defaultLayout : 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);


app

    //Static Middle Ware
    .use(express.static(__dirname + '/public'))

    //Detect Query String Middle Ware
    .use(function(req, res, next){
        res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
        next();
    })

    //Home Page
    .get('/', function(req, res){
        res.render('home');
    })

    //About Page
    .get('/about', function(req, res){
        res.render(
            'about',
            {
                fortune: fortune.getFortune(),
                pageTestScript: '/qa/tests-about.js'
            }
        );
    })

    //Custom 404 Page
    .use(function(req, res){
        res.status(404);
        res.render('404');
    })

    //Custom 500 Page
    .use(function(err, req, res, next){
       console.error(err.stack) ;
        res.status(500);
        res.render('500');
    })

    //Listen
    .listen(app.get('port'), function(){
       console.log('Express Started on http://localhost:' + app.get('port') + '; press Ctrl + C to terminate.');
    });