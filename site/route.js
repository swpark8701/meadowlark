/**
 * Created by sewonpark on 2016-02-05.
 */

var main = require('./handlers/main.js');

module.exports = function(app){
    app
        //Header Info
        .get('/headers', function(req, res){
            res.type('text/plain');
            var s = '';
            for(var name in req.headers) s+= name + ': ' + req.headers[name] + '\n';
            res.send(s);
        })

        //Home Page
        .get('/', main.home)

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
        .get('/about', main.about)

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

        ////Web API - Basic Get
        //.get('/api/tours', function(req, res){
        //    res.json(tours);
        //})
        //
        ////Web Api - PUT
        //.put('/api/tour/:id', function(req, res){
        //    var p = tours.filter(function(p){ return p.id == req.params.id;})[0];
        //    if(p){
        //        if( req.query.name ) p.name = req.query.name;
        //        if( req.query.price ) p.price = req.query.price;
        //        res.json({success: true});
        //    }else{
        //        res.json({error : 'No such tour exists.'});
        //    }
        //})
        //
        ////Web Api - DEL
        //.del('/api/tour/:id', function(req, res){
        //    var i;
        //    for(i=tours.length-1; i>=0; i--)
        //        if(tours[i].id == req.params.id) break;
        //
        //    if(i >= 0){
        //        tours.splice(i, 1);
        //        res.json({success:true});
        //    }else{
        //        res.json({error:'No such tour exists.'});
        //    }
        //
        //})

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
                if(err){
                    res.session.flash = {
                        type: 'danger',
                        intro: 'Oops!',
                        message: 'There was an error processing your submission. Please try again.'
                    };
                    return res.redirect(303, '/contest/vacation-photo');
                }

                var photo = files.photo;
                var dir = vacationPhotoDir + '/' + Date.now();
                var path = dir + '/' + photo.name;
                fs.mkdirSync(dir);
                fs.renameSync(photo.path, dir + '/' + photo.name);
                saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
                req.session.flash = {
                    type : 'success',
                    intro : 'Good luck!',
                    message : 'You have been entered into the contest.'
                };
                return res.redirect(303, '/contest/vacation-photo/entries');

                //
                //console.log('received fields:');
                //console.log(fields);
                //console.log('received files:');
                //console.log(files);
                //res.redirect(303, '/thank-you');
            });
        })

        //.get('/cart/checkout', function(req, res, next){
        //    var cart = req.session.cart;
        //    console.log(':::::::::::::::::::::::CART- GET');
        //    if(!cart) next();
        //    res.render('cart-checkout');
        //})

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

        .get('/cart/add', function(req, res, next){
            var cart = req.session.cart || (req.session.cart = { items : [] });
            Vacation.findOne({ sku: req.query.sku }, function(err, vacation){
                if(err) return next(err);
                if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.query.sku));

                cart.items.push({
                    vacation: vacation,
                    guests: req.body.guests || 1
                });
                res.redirect(303, '/cart');
            });
        })

        .post('/cart/add', function(req, res, next){
            var cart = req.session.cart || (req.session.cart = { items: [] });
            Vacation.findOne({ sku: req.body.sku }, function(err, vacation){
                if(err) return next(err);
                if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.body.sku));
                cart.items.push({
                    vacation: vacation,
                    guests: req.body.guests || 1,
                });
                res.redirect(303, '/cart');
            });
        })
        .get('/cart', function(req, res, next){
            var cart = req.session.cart;
            if(!cart) next();
            res.render('cart', { cart: cart });
        })

        .get('/cart/checkout', function(req, res, next){
            var cart = req.session.cart;
            if(!cart) next();
            res.render('cart-checkout');
        })

        .get('/set-currency/:currency', function(req, res){
            req.session.currency = req.params.currency;
            return res.redirect(303, '/vacations');
        })

        .get('/vacations', function(req, res){
            Vacation.find({ available: true }, function(err, vacations){
                var currency = req.session.currency || 'USD';
                var context = {
                    currency : currency,
                    vacations : vacations.map(function(vacation){
                        return {
                            sku : vacation.sku,
                            name: vacation.name,
                            description : vacation.description,
                            price: convertFromUSD(vacation.priceInCents/100, currency),
                            qty: vacation.qty,
                            inSeason: vacation.inSeason
                        };
                    })
                };
                switch(currency){
                    case 'USD' : context.currencyUSD = 'selected'; break;
                    case 'GBP' : context.currencyGBP = 'selected'; break;
                    case 'BTC' : context.currencyBTC = 'selected'; break;
                }
                res.render('vacations', context);
            });
        })

        .get('/notify-me-when-in-season', function(req, res) {
            res.render('notify-me-when-in-season', { sku: req.query.sku });
        })

        .post('/notify-me-when-in-season', function(req, res){
            VacationInSeasonListener.update(
                { email: req.body.email },
                { $push: { skus: req.body.sku }},
                { upsert: true },
                function(err){
                    if(err){
                        console.error(err.stack);
                        req.session.flash = {
                            type: 'danger',
                            intro: 'Oops!',
                            message: 'There was an error processing your request.'
                        };
                        return res.redirect(303, '/vacations');
                    }
                    req.session.flash = {
                        type: 'success',
                        intro: 'Thank you!',
                        message: 'You will be notified when this vacation is in season.'
                    };
                    return res.redirect(303, '/vacations');
                }
            );
        })

        //.get('/api/attractions', function(req, res){
        //    Attraction.find({ approved: true }, function(err, attractions){
        //        if(err) return res.status(500).send('Error occurred: DB Error');
        //        res.json(attractions.map(function(a){
        //            return {
        //                name : a.name,
        //                id: a._id,
        //                description : a.description,
        //                location: a.location
        //            };
        //        }));
        //    });
        //})
        //
        //.post('/api/attraction', function(req, res){
        //    var a = new Attraction({
        //        name : req.body.name,
        //        description: req.body.description,
        //        location: { lat: req.body.lat, lng: req.body.lng },
        //        history: {
        //            event: 'created',
        //            email: req.body.email,
        //            date: new Date()
        //        },
        //        approved: false
        //    });
        //
        //    a.save(function(err, a){
        //       if(err) return res.status(500).send('Error occurred: DB ERROR');
        //        res.json({ id : a._id});
        //    });
        //
        //})
        //
        //.get('/api/attraction/:id', function(req, res){
        //    Attraction.findById(req.params.id, function(err, a){
        //        if(err) return res.status(500).send('Error occurred : DB Error');
        //        res.json({
        //            name: a.name,
        //            id: a._id,
        //            description: a.description,
        //            location: a.location
        //        });
        //    })
        //});

};