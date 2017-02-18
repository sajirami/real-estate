//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );


//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get( '/', function ( req, res ) {

    callLeboncoin( function ( lbcData ) {
        callMeilleurAgent( lbcData, function ( maData ) {
            estimation( lbcData, function ( estimationData ) {
                comparer( lbcData, maData, estimationData, res )
            })

        })
    });


    var url = req.query.urlLBC

    res.render( 'home', {
        message: 'The Home Page!',
        link: url
    });
});
//makes the server respond to the '/call' route and serving the 'home.ejs' template in the 'views' directory
/*app.get( '/call', function ( req, res ) {

    var url = req.query.urlLBC

    res.render( 'home', {
        message: url

    });
});*/

//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});

//fonction recupère les données de l'annonce sur le site Leboncoin
function callLeboncoin( receivedLBCData ) {
    var urlLBC = 'https://www.leboncoin.fr/ventes_immobilieres/1062847924.htm?ca=12_s'

    request( urlLBC, function ( error, response, html ) {
        console.log( response.statusCode );
        if ( !error && response.statusCode == 200 ) {

            var $ = cheerio.load( html )

            var lbcDataArray = $( 'section.properties span.value' );
            //.trim()  enleve les espaces
            //  /\s/g  g: global pour selectionner tout          
            let lbcData = {
                price: parseInt( $( lbcDataArray.get( 0 ) ).text().replace( /\s/g, '' ), 10 ),
                city: $( lbcDataArray.get( 1 ) ).text().trim().toLowerCase().replace( /\_|\s/g, '-' ),
                type: $( lbcDataArray.get( 2 ) ).text().trim().toLowerCase(),
                surface: parseInt( $( lbcDataArray.get( 4 ) ).text().replace( /\s/g, '' ), 10 )
            }
            console.log( lbcData )
            receivedLBCData( lbcData )
        }
        else {
            console.log( error );
        }
    })
}
//fonction recupère les donnée de l'annonce sur le site MeilleurAgent
function callMeilleurAgent( lbcData, receivedMaData ) {
    var urlMAgent = 'https://www.meilleursagents.com/prix-immobilier/' + lbcData.city

    request( urlMAgent, function ( error, response, html ) {
        if ( !error && response.statusCode == 200 ) {

            const $ = cheerio.load( html )

            const maDataArray = $( 'div.prices-summary div.prices-summary__cell--median' );

            let maData = {
                Appartement_Price: parseInt( $( maDataArray.get( 0 ) ).text().replace( /\s/g, '' ), 10 ),
                House_Price: parseInt( $( maDataArray.get( 1 ) ).text().replace( /\s/g, '' ), 10 ),
                MonthlyRent_Price: parseFloat( $( maDataArray.get( 2 ) ).text().replace( /\s/g, '' ), 10 )
            }
            console.log( maData )
            receivedMaData( maData )

        }
        else {
            console.log( error );
        }
    })
}

function estimation( lbcData, receivedEstiData ) {
    let estimationData = {
        Estimation_M2_Price: parseInt( lbcData.price / lbcData.surface )
    }
    console.log( estimationData )
    receivedEstiData( estimationData )
}

function comparer( lbcData, maData, estimationData, res ) {
    if ( lbcData.type == "appartement" ) {
        if ( estimationData.Estimation_M2_Price <= maData.Appartement_Price ) {
            console.log( "It's a good deal!" )
            res.render( 'home', {
                result: "It's a good deal!"
            })
        }
        else {
            console.log( "It's a bad deal! Look for a better deal." )
            res.render( 'home', {
                result: "It's a bad deal! Look for a better deal."
            })
        }
    }
    if ( lbcData.type == "maison" ) {
        if ( estimationData.Estimation_M2_Price <= maData.House_Price ) {
            console.log( "It's a good deal!" )
            res.render( 'home', {
                result: "It's a good deal!"
            })
        }
        else {
            console.log( "It's a bad deal! Look for a better deal." )
            res.render( 'home', {
                result: "It's a bad deal! Look for a better deal."
            })
        }
    }
}


