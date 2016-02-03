/**
 * Created by sewonpark on 2016-02-01.
 */
var express = require('express');

var app = express();

var fortune = require('../lib/fortune.js');

//Handlebars
var handlebars = require('express-handlebars')
                    .create(
                        {
                            defaultLayout : 'main',
                            extname: '.hbs',
                            helpers : {
                                section: function(name, options){
                                    if(!this._sections) this._sections = {};
                                    this._sections[name] = options.fn(this);
                                    return null;
                                }
                            }
                        }
                    );


//formidable
var formidable = require('formidable');

//jQuery Upload MiddleWare
var jqupload = require('jquery-file-upload-middleware');


//if(app.thing === null ) console.log('bleat!');

//Mock
var tours = [
    { id: 0, name: 'Hood River', price: 99.99 },
    { id: 1, name: 'Oregon Coast', price: 149.95 }
];

//Credentials
var credentials = require('./credentials.js');


var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app
    .engine('hbs', handlebars.engine)

    .set('view engine', 'hbs')

    .set('port', process.env.PORT || 3000)

    .disable('x-powered-by')

    //Static Middle Ware
    .use(express.static(__dirname + '/public'))

    //Body-Parser Middle Ware
    .use(require('body-parser').urlencoded({extended: true}))

    //Detect Query String Middle Ware
    .use(function(req, res, next){
        res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
        next();
    })

    //Weather Partial Context Inject Middle Ware
    .use(function(req, res, next){
        if(!res.locals.partials) res.locals.partials = {};
        res.locals.partials.weatherContext = getWeatherData();
        next();
    })

    //jQuery Upload Middle Ware
    .use('/upload', function(req, res, next){
        var now = Date.now();
        jqupload.fileHandler({
            uploadDir: function(){
                return __dirname + '/public/uploads/' + now;
            },
            uploadUrl: function(){
                return '/uploads/' + now;
            }
        })(req, res, next);

    })

    //Cookie Parser Middle Ware
    .use(require('cookie-parser')(credentials.cookieSecret))

    //Express Session
    .use(require('express-session')({
        resave : false,
        saveUninitialized: false,
        secret: credentials.cookieSecret
    }))

    //Flash Message Middle ware
    .use(function(req, res, next){
        res.locals.flash = req.session.flash;
        delete req.session.flash;
        next();
    })


    //Custom Middle Ware
    .use(function(req, res, next){
        console.log('processing request for"' + req.url + '"....');
        next();
    })

    .use(function(req, res, next){
        console.log('terminating request');
        res.send('thanks for playing!');
    })

    .use(function(req, res, next){
        console.log('whoops, i\'ll never get called!');
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

    //ErrorPage
    .get('/error', function(req, res){
        res
            .status(500)
            .render('500');
    })

    //Parameters
    .get('/greeting', function(req, res){
        res.render('about', {
            message: 'welcome',
            style: req.query.style,
            //userid: req.cookie.userid,
            //username: req.session.username
        });
    })

    //No-layout
    .get('/no-layout', function(req, res){
        res.render('no-layout', { layout: null });
    })

    //Custom Layout
    .get('/custom-layout', function(req, res){
        res.render('custom-layout', {layout: 'custom'});
    })

    //Test Text
    .get('/test', function(req, res){
        res
            .type('text/plain')
            .send('this is a test');
    })

    //Thank you page
    .get('/thank-you', function(req, res){
        res.render('thank-you');
    })

    //Basic Form Process
    .post('/process-contact', function(req, res){
        console.log('Received contact from ' + req.body.name + ' <' + req.body.email + '>');
        //TODO:: Save To DB
        res.redirect(303, '/thank-you');
    })

    //Advance Form Process
    .post('/process-contact-adv', function(req, res){
        //TODO :: Must Use Body-Parser Middle Ware

        console.log('Received contact from ' + req.body.name + ' <' + req.body.email + '>');

        try{

            //TODO:: Save To DB

            return res.xhr ? res.render({success: true}) : res.redirect(303, '/thank-you');

        }catch(ex){
            return res.xhr ? res.render({error : 'DB Error'}) : res.redirect(303, '/db-error');
        }
    })

    //Web API - Basic Get
    .get('/api/tours', function(req, res){
        res.json(tours);
    })

    //Web Api - PUT
    .put('/api/tour/:id', function(req, res){
        var p = tours.filter(function(p){ return p.id == req.params.id;})[0];
        if(p){
            if( req.query.name ) p.name = req.query.name;
            if( req.query.price ) p.price = req.query.price;
            res.json({success: true});
        }else{
            res.json({error : 'No such tour exists.'});
        }
    })

    //Web Api - DEL
    .del('/api/tour/:id', function(req, res){
        var i;
        for(i=tours.length-1; i>=0; i--)
            if(tours[i].id == req.params.id) break;

        if(i >= 0){
            tours.splice(i, 1);
            res.json({success:true});
        }else{
            res.json({error:'No such tour exists.'});
        }

    })

    //Client Template
    .get('/nursery-rhyme', function(req, res){
        res.render('nursery-rhyme');
    })

    //Client Template Data
    .get('/data/nursery-rhyme', function(req, res){
        res.json({
            animal: 'squirrel',
            bodyPart: 'tail',
            adjective: 'bushy',
            noun: 'heck'
        });
    })

    //NewsLetter Form
    .get('/newsletter', function(req, res){
        //What is CSRF?!
        res.render('newsletter', { csrf: 'CSRF token goes here' });
    })

    .post('/newsletter', function(req, res){
        var name = req.body.name || '', email = req.body.email || '';

        //Validation Check
        if(!email.match(VALID_EMAIL_REGEX)){
            if(req.xhr) return res.json({ error: 'Invalid name email address.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Validation error!',
                message: 'The email address you entered was not valid.'
            };
            return res.redirect(303, '/newsletter/archive');
        }

        new NewsletterSignup({name: name, email: email}).save(function(err){
            if(err){
                if(req.xhr) return res.json({ error: 'Database error'});
                req.session.flash = {
                    type: 'danger',
                    intro: 'Database error!',
                    message: 'There was a database error; please try again later.'
                }

                return res.redirect(303, '/newsletter/archive');
            };
        })

    })


    .post('/process', function(req, res){
        console.log('Form (from querystring): ' + req.query.form);
        console.log('CSRF token (from hidden form field): ' + req.body._csrf);
        console.log('Name (from visible form field): ' + req.body.name);
        console.log('Email (from visible form field): ' + req.body.email);

        if(req.xhr || req.accepts('json,html') === 'json'){
            res.send({success: true});
            //TODO :: If Error, Send error Json
        }else{
            //TODO :: If Error, Redirect To Error Page
            res.redirect(303, '/thank-you');
        }
    })

    //PhotoContest Form
    .get('/contest/vacation-photo', function(req, res){
        var now = new Date();
        res.render('contest/vacation-photo', {
            year: now.getFullYear(),
            month: now.getMonth()
        });
    })

    //PhotoContest Form Process
    .post('/contest/vacation-photo/:year/:month', function(req, res){
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files){
            if(err) return res.redirect(303, '/error');
            console.log('received fields:');
            console.log(fields);
            console.log('received files:');
            console.log(files);
            res.redirect(303, '/thank-you');
        });
    })

    //Custom 500 Page
    .use(function(err, req, res, next){
       console.error(err.stack) ;
        res.status(500);
        res.render('500');
    })

    //Custom 404 Page
    .use(function(req, res){
        res.status(404);
        res.render('404');
    })

    //Listen
    .listen(app.get('port'), function(){
       console.log('Express Started on http://localhost:' + app.get('port') + '; press Ctrl + C to terminate.');
    });


//Mock Weather Data Get Function
function getWeatherData(){
    return{
      locations:[
          {
              name: 'Portland',
              forecastUrl: 'http://www.wunderground.com/US/OR/Protland.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
              weather : 'Overcast',
              temp : '54.1 F (12.3 C)'
          },
          {
              name: 'Bend',
              forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
              weather : 'Partly Cloudy',
              temp : '55.0 F (12.8 C)'
          },
          {
              name: 'Manzanita',
              forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
              weather : 'Light Rain',
              temp : '55.0 F (12.8 C)'
          }
      ]
    };
}