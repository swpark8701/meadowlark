/**
 * Created by sewonpark on 2016-02-01.
 */
var express = require('express');

var app = express();

//Credentials
var credentials = require('./credentials.js');

var fortune = require('../lib/fortune.js');

//Custom Mailer
var emailService = require('../lib/email.js')(credentials);

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




var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;


//Node Mailer
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth:{
        user: credentials.gmail.user,
        pass: credentials.gmail.password
    }
});

//
//transporter.sendMail({
//    from: '"swp" <seone2000@daum.net>',
//    to : 'seone2000@naver.com',
//    subject : 'Your Meadowlark Travel Tour',
//    text: 'Thank you for booking tour trip with Meadowlark Travel. We look forward to your visit!'
//}, function(err){
//    if(err) console.error('Unable to send email: ' + err);
//})

switch(app.get('env')){
    case 'development' :
        app.use(require('morgan')('dev'));
        break;
    case 'production' :
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}


app
    .engine('hbs', handlebars.engine)

    .set('view engine', 'hbs')

    .set('port', process.env.PORT || 3000)

    .disable('x-powered-by')

    //Domain
    .use(function(req, res, next){

        // Create Domain for Request
        var domain = require('domain').create();

        // Process Error Occurs in Domain
        domain.on('error', function(err){

            console.error('DOMAIN ERROR CAUGHT\n', err.stack);
            try{

                //Safely Shutdown After 5Seconds
                setTimeout(function(){
                    console.error('Failsafe shutdown.');
                    process.exit(1);
                }, 5000);

                //Disconnect Cluster
                var worker = require('cluster').worker;
                if(worker) worker.disconnect();

                //Stop Receiving Request
                server.close();
                try{
                    //Try Express Error Route
                    next(err);
                }catch(err){

                    //If Fail Express Error Route, Use General Node Response.
                    console.error('Express error mechanism failed.\n', err.stack);
                    res.statusCode = 500;
                    res.set('text/plain');
                    res.end('Server Error.');
                }

            }catch(err){

                console.error('unable to send 500 response.\n', err.stack);

            }
        });

        domain.add(req);
        domain.add(res);

        // Other Request Process to Domain
        domain.run(next);

    })

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
    //.use(function(req, res, next){
    //    console.log('processing request for"' + req.url + '"....');
    //    next();
    //})
    //
    //.use(function(req, res, next){
    //    console.log('terminating request');
    //    res.send('thanks for playing!');
    //})
    //
    //.use(function(req, res, next){
    //    console.log('whoops, i\'ll never get called!');
    //})

    //Worker Info
    .use(function(req, res, next){
        var cluster = require('cluster');
        if(cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
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

    //Fail PAge
    .get('/fail', function(req, res){
        throw new Error('Nope!');
    })

    //Uncaught Error
    .get('/epic-fail', function(req, res){
       process.nextTick(function(){
          throw new Error('Kaboom!');
       });
    })

    //About Page
    .get('/about', function(req, res){

        var cart = {
            billing : {
                name : 'TEST=~PORDUCT'
            },
            number : 5
        };

        res.render('email/cart-thank-you', { layout: null, cart: cart }, function(err, html){
            if(err) console.log('error in email template');
            emailService.send('seone2000@naver.com', 'yesMan', html);
        });


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
                };

                return res.redirect(303, '/newsletter/archive');
            }
        });

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

    .get('/cart/checkout', function(req, res, next){
        var cart = req.session.cart;
        console.log(':::::::::::::::::::::::CART- GET');
        if(!cart) next();
        res.render('cart-checkout');
    })

    .post('/cart/checkout', function(req, res, next){
        var cart = req.session.cart;
        console.log(':::::::::::::::::::::::CART- POST');
        if(!cart) next(new Error('Cart does not exist.'));
        var name = req.body.name || '';
        var email = req.body.email || '';

        //Validation check
        if(!email.match(VALID_EMAIL_REGEX))
            return res.next(new Error('Invalid email address.'));

        //Random Cart Id
        cart.number = Math.random().toString().replace(/^0\.0*/, '');
        cart.billing = {
            name : name,
            email: email
        };
        res.render('email/cart-thank-you', { layout: null, cart: cart }, function(err, html){
            if(err) console.log('error in email template');

            transporter.sendMail({
                from: '"swp" <seone2000@daum.net>',
                to : cart.billing.email,
                subject : 'Thank you for Book your Trip with Meadowlark',
                html : html,
                generateTextFromHtml: true
            }, function(err){
                if(err) console.error('Unable to send confirmation: ' + err.stack);
            });
        });

        res.render('cart-thank-you', { cart: cart });
    })

    //Custom 500 Page
    .use(function(err, req, res, next){
       console.error(err.stack) ;
        res.status(500)
        .render('500');
    })

    //Custom 404 Page
    .use(function(req, res){
        res.status(404);
        res.render('404');
    });


//var server = app.listen(app.get('port'), function(){
//   console.log('Listeing on port %d', app.get('port'));
//});

function startServer(){
    //Listen
    app.listen(app.get('port'), function(){
       console.log('Express Started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + '; press Ctrl + C to terminate.');
    });
}

if(require.main === module){
    startServer();
}else{
    module.exports = startServer;
}

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