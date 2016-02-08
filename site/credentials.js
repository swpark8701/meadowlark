/**
 * Created by sewonpark on 2016-02-03.
 */
module.exports = {
    cookieSecret: 'your cookie secret goes here',
    gmail: {
        user: 'angel.f.0719',
        password: 'peaceboy13'
    },
    mongo: {
        development: {
            connectionString: 'mongodb://web_site:peaceboy13@ds055905.mongolab.com:55905/swpark-dev'
        },
        production: {
            connectionString: 'mongodb://web_site:peaceboy13@ds055905.mongolab.com:55905/swpark-dev'
        }
    },
    authProviders: {
        facebook: {
            development:{
                appId: '1662769167307497',
                appSecret: '2804121b3da824a077c7f243697bc8d9'
            }
        }
    }
};