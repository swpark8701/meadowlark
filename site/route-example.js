/**
 * Created by sewonpark on 2016-02-04.
 */
var app = require('express')();

app
    .use(function(req, res, next){
        console.log('\n\nALLWAYS');
        next();
    })
    .get('/a', function(req, res){
        console.log(('/a: route terminated'));
        res.send('a');
    })

    .get('/a', function(req, res){
        console.log('/a: never called');
    })

    .get('/b', function(req, res, next){
        console.log('/b: route not terminated');
        next();
    })

    .use(function(req, res, next){
        console.log('SOMETIMES');
        next();
    })

    .get('/b', function(req, res, next){
        console.log(('/b (part2): error thrown'));
        throw new Error('b failed');
    })

    .use('/b', function(err, req, res, next){
        console.log('/b error detected and passedon');
        next(err);
    })

    .get('/c', function(err, req){
        console.log('/c: error thrown');
        throw new Error('c failed');
    })

    .use('/c', function(err, req, res, next){
        console.log('/c: error detected but not passed on');
        next();
    })

    .use(function(err, req, res, next){
        console.log('unhandled error detected: ' + err.message);
        res.send('500 - server error');
    })

    .use(function(req, res){
        console.log('route not handled');
        res.send('404 - not found');
    })

    .listen(3000, function(){
        console.log('listening on 3000');
    });