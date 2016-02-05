/**
 * Created by sewonpark on 2016-02-05.
 */
var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress tests', function(){
    test('Homepage shuold handle 50 requests in a second', function(done){
        var options = {
            url: 'http://localhost:3000',
            concurrency: 4,
            maxRequests: 50,
        };

        loadtest.loadTest(options, function(err, result){
            expect(!err);
            expect(result.totalTimeSeconds < 1);
            done();
        })
    })
})