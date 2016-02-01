/**
 * Created by sewonpark on 2016-02-01.
 */
var express = require('express');

var app = express();


//Handlebars
var handlebars = require('express-handlebars').create({ defaultLayout : 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);


var fortunes = [
    "Conquer your fears of they will conquer you",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple."
];


app

    //Static Middle Ware
    .use(express.static(__dirname + '/public'))

    //Home Page
    .get('/', function(req, res){
        res.render('home');
    })

    //About Page
    .get('/about', function(req, res){
        var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        res.render('about', {fortune: randomFortune});
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