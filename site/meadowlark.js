/**
 * Created by sewonpark on 2016-02-01.
 */

var https = require('https');
var express = require('express');

var app = express();

//Credentials
var credentials = require('./credentials.js');

var fortune = require('../lib/fortune.js');

//Custom Mailer
var emailService = require('../lib/email.js')(credentials);

var fs = require('fs');


var httpsOptions = {
    key: fs.readFileSync('../ssl/meadowlark.pem'),
    cert: fs.readFileSync('../ssl/meadowlark.crt')
};






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
                                },
                                static: function(name){
                                    return require('../lib/static.js').map(name);
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




//File
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, mont, photoPath){
    //TODO:: Complete Later
}



//DB
var mongoose = require('mongoose');
var opts ={
    server: {
        socketOptions: { keepAlive: 1}
    }
};
switch(app.get('env')){
    case 'development' :
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        break;
    case 'production' :
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        break;
    default :
        throw new Error('Unknown execution environment: ', app.get('env'));
}


var Vacation = require('./models/vacation.js');

Vacation.find(function(err, vacations){

    if(err) return console.error(err);
    if(vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description : 'Spend a day sailing on the Columbia and enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-gataway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend geaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold:0
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend geaway', 'bend', 'high desert', 'rock climbing'],
        inSeason: true,
        maximunGuests: 4,
        available: false,
        packagesSold : 0,
        notes: 'The tour guide is currently recovering from a skiing accident.'
    }).save();


});

var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');


var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({
    url : credentials.mongo[app.get('env')].connectionString
});

var auth = require('../lib/auth.js')(app, {
    baseUrl: process.env.BASE_URL,
    providers: credentials.authProviders,
    successRedirect: '/account',
    failureRedirect: '/unauthorized'
});




var bundler = require('connect-bundle')(require('./config.js'));
app.use(bundler);

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

    //CORS
    .use('/api', require('cors')())

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
        secret: credentials.cookieSecret,
        store: sessionStore
    }))

    .use(require('csurf')())
    .use(function(req, res, next){
        res.locals._csrfToken = req.csrfToken();
        next();
    })


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
    });


var static = require('../lib/static.js').map;

app.use(function(req, res, next){
   var now = new Date();
    res.locals.logoImage = now.getMonth()==11 && now.getDate() == 19 ? static('/img/logo_bud_clark.png') : static('/img/logo.png');
    next();
});


auth.init();

auth.registerRoutes();

//Route
require('./route.js')(app);

var vhost = require('vhost');

var Attraction = require('./models/attraction.js');
// API configuration
var apiOptions = {
    context: '/',
    domain: require('domain').create(),
};

apiOptions.domain.on('error', function(err){
    console.log('API domain error.\n', err.stack);
    setTimeout(function(){
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    server.close();
    var worker = require('cluster').worker;
    if(worker) worker.disconnect();
});


var rest = require('connect-rest').create(apiOptions);

// link API into pipeline
app.use(vhost('api.*', rest.processRequest(apiOptions)));

rest.get('/attractions', function(req, content, cb){
    Attraction.find({ approved: true }, function(err, attractions){
        if(err) return cb({ error: 'Internal error.' });
        cb(null, attractions.map(function(a){
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('/attraction', function(req, content, cb){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function(err, a){
        if(err) return cb({ error: 'Unable to add attraction.' });
        cb(null, { id: a._id });
    });
});

rest.get('/attraction/:id', function(req, content, cb){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return cb({ error: 'Unable to retrieve attraction.' });
        cb(null, {
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});


//Custom 500 Page
app.use(function(err, req, res, next){
   console.error(err.stack) ;
    res.status(500)
    .render('500');
});

var autoViews = {};

app.use(function(req, res, next){

    var path = req.path.toLowerCase();
    if(autoViews[path]) return res.render(autoViews[path]);

    if(fs.existsSync(__dirname + '/views' + path + '.hbs')){
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }

    next();

});

    //Custom 404 Page
app.use(function(req, res){
    res.status(404);
    res.render('404');
});


//var server = app.listen(app.get('port'), function(){
//   console.log('Listeing on port %d', app.get('port'));
//});

function startServer(){
    ////Listen
    //https.createServer(httpsOptions, app).listen(app.get('port'), function(){
    //    console.log('Express Started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + '; press Ctrl + C to terminate.');
    //});


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


function convertFromUSD(value, currency){
    switch(currency){
        case 'USD' : return value * 1;
        case 'GBP' : return value * 0.6;
        case 'BTC' : return value * 0.0023707918444761;
        default: return NaN;
    }
}