/**
 * Created by sewonpark on 2016-02-05.
 */
module.exports ={
    bundles:{
        clientJavaScript:{
            main: {
                file: '/js/meadowlark.min.8ee96970.js',
                location: 'head',
                contents:[
                    '/js/contact.js',
                    '/js/cart.js'
                ]
            }
        },
        clientCss:{
            main: {
                file: '/css/meadowlark.min.1ca551b4.css',
                contents:[
                    '/css/main.css',
                    '/css/cart.css'
                ]
            }
        }
    }
}