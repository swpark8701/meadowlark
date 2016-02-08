/**
 * Created by sewonpark on 2016-02-08.
 */
var User = require('../site/models/user.js');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


passport.serializeUser(function(user, done){
    done(null, user._id);
});

passport.deserializeUser(function(id, done){
   User.findById(id, function(err, user){
      if(err || !user) return done(err, null);
       done(null, user);
   });
});


module.exports = function(app, options){

    if(!options.successRedirect) options.successRedirect = '/account';
    if(!options.failureRedirect) options.failureRedirect = '/login';

    return{

        init:
            function(){
                var env = app.get('env');
                var config = options.providers;

                //Set Facebook Auth Plan
                passport.use(new FacebookStrategy({
                    clientID: config.facebook[env].appId,
                    clientSecret: config.facebook[env].appSecret,
                    callbackURL: (options.baseUrl || '') + '/auth/facebook/callback'
                }, function(accessToken, refreshToken, profile, done){
                    var authId = 'facebook:' + profile.id;
                    User.findOne({ authId: authId}, function(err, user){
                        if(err) return done(err, null);
                        if(user) return done(null, user);
                        user = new User({
                            authId: authId,
                            name: profile.displayName,
                            created: Date.now(),
                            role: 'customer'
                        });
                    });
                }));

                app.use(passport.initialize());
                app.use(passport.session());
            }
        ,
        registerRoutes:
            function(){
                //Register Facebook Router
                app.get('/auth/facebook', function(req, res, next){
                    if(req.query.redirect) req.session.authRedirect = req.query.redirect;
                    passport.authenticate('facebook')(req, res, next);
                });

                app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: options.failureRedirect }),
                    function(req, res){
                        //When Auth Complete, In this.
                        console.debug('::::::::::::::AUTH SUCCESS');
                        var redirect = req.session.authRedirect;
                        if(redirect) delete req.session.authRedirect;
                        res.redirect(303, redirect || options.successRedirect);
                    }
                );
            }

    };
};