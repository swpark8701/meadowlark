/**
 * Created by sewonpark on 2016-02-05.
 */
var fortune = require('../../lib/fortune.js');

exports.home =  function(req, res){
    res.render('home');
};

exports.about = function(req, res){

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
};
