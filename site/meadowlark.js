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


//if(app.thing === null ) console.log('bleat!');

app

    //Static Middle Ware
    .use(express.static(__dirname + '/public'))

    //Detect Query String Middle Ware
    .use(function(req, res, next){
        res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
        next();
    })

    //Header Info
    .get('/headers', function(req, res){
        res.type('text/plain');
        var s = '';
        for(var name in req.headers) s+= name + ': ' + req.headers[name] + '\n';
        res.send(s);
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

    //Hood river
    .get('/tours/hood-river', function(req, res){
        res.render('tours/hood-river');
    })

    //Request Group Rate
    .get('/tours/request-group-rate', function(req, res){
        res.render('tours/request-group-rate');
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