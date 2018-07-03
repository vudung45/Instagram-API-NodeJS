var ReactDOMServer = require('react-dom/server')
var express = require('express')
var InstagramLoginAPI = require('./app/index.js')
var CustomAuth = require('./app/unofficial.js')
var bodyParser = require('body-parser');
var browserify = require('browserify')
var path = require('path')
var request = require('request')
var session = require('express-session')
var InstagramAuth = require('./instagramauth.js')

var app = express()

app.use(session({
    path: '/',
    secret: 'testing',
}))

app.use(bodyParser.json());

app.set('trust proxy', 1) // trust first proxy


InstagramSessions = {}

/**
This code contains 2 approaches that I investigated
1. Unofficial - Working 
	127.0.0.1:8080/

2.Official Instagram API
 This was my initial approach by I failed because Instagram has prohibitted
 developers from retrieving the information we specificlly want in this case
 	The code for it can be found beneath

	127.0.0.1:8080/instagram_api

 I also played around with this project by adding a little bit of reactjs. 
 Even though no interface was designed, it was a fun experience.

**/


/**
Unofficial API Approach
**/
app.get('/', (req, res, next) => {
    console.log(req.session)
    //Client-side rendering react
    res.sendFile(path.join(__dirname + '/skeleton.html'));
})


//react rendering
app.get('/client.js', (req, res) => {
    browserify('./app/bundle.js', {
            debug: true
        })
        .transform('reactify')
        .bundle()
        .pipe(res);

})

//react rendering
app.get('/localapi', (req, res, next) => {
    data = {
        isLoggedIn: false,
        userdata: {}
    }
    if (req.session.isLoggedIn) {
        data.isLoggedIn = true
        var AuthSession = InstagramSessions[req.sessionID]
        data.userdata = {
            'userid': AuthSession.userid,
            'username': AuthSession.username,
            'fullname': AuthSession.fullname,
            'profile_pic': AuthSession.profile_pic
        }

    }
    res.json(data)



})


app.get('/unfollow', (req, res) => {
    if (req.session.isLoggedIn) {
        console.log("here")
        console.log(req.query)
        if (typeof(req.query.uid) != 'undefined') {
            var AuthSession = InstagramSessions[req.sessionID]
            AuthSession.unfollow(req.query.uid, (data) => {
                try {
                    data = JSON.parse(data)
                    if (data.status == "ok") {
                        res.json({
                            success: true
                        })
                    } else
                        res.json({
                            success: false
                        })

                } catch (e) {
                    console.log(e)
                    res.json({
                        success: false
                    })
                }
            })
        }
    } else {
        res.json({
            success: false
        })

    }
})

app.get('/getFollowings', (req, res) => {
    if (req.session.isLoggedIn) {
        var AuthSession = InstagramSessions[req.sessionID]
        AuthSession.getFollowings(null, (data) => {
            try {
                res.json({
                    success: true,
                    data: JSON.parse(data)
                })
            } catch (e) {
                res.json({
                    success: false
                })
            }
        })
    } else {
        res.json({
            success: false
        })

    }
})

app.get('/logout', (req, res, next) => {
    if (req.session.isLoggedIn) {
        var AuthSession = InstagramSessions[req.sessionID]
        AuthSession.logout((data) => {
            req.session.destroy();
            delete InstagramSessions[req.sessionID]
            res.redirect("/")


        })
    } else
        res.redirect("/")
})


//login through unofficial api
app.post('/login', (req, res, next) => {
    var username = req.body.username
    var password = req.body.password
    var AuthSession = new InstagramAuth(username, password)

    AuthSession.login((data) => {
        try 
        {
        	data = JSON.parse(data)
	        if (data.success) {
	            req.session.isLoggedIn = true
	            InstagramSessions[req.sessionID] = AuthSession
	            console.log("Logged in successfully")
	            userdata = {
	                'userid': AuthSession.userid,
	                'username': AuthSession.username,
	                'fullname': AuthSession.fullname,
	                'profile_pic': AuthSession.profile_pic
	            }
	            res.json({
	                success: true,
	                message: "Logged in successfully",
	                userdata: userdata
	            })

	            /**
	            	I couldn't finish this part because my IP was banned from this API
	            	However, this is nearly done!
	            **/
	            // AuthSession.getFollowings(null,(data)=>{
	            // 	console.log(data) // This should output list of followers
	            // })
	        } else {
	            res.json({
	                success: false,
	                message: data.response
	            })
	        }
	    } catch (e)
	    {
	    	res.json({
	                success: false,
	                message: "Something went wrong!"
	            })	
	    }
    })


})


/** -----------------
	INSTAGRAM Offical API Approach
**/

var instagram_config = {
    client_id: "8472043dd29548b39733275c1904d958",
    redirect_uri: "http://localhost:8080/accesstoken",
    client_secret: "e2388689c80649e3a9c006929c6b0748",
    scope: "basic+follower_list+relationships"

}


var auth_link = "https://www.instagram.com/oauth/authorize/?client_id=" + instagram_config.client_id + "&redirect_uri=" +
    instagram_config.redirect_uri + "&scope=" + instagram_config.scope + "&response_type=code"

//Homepage
app.get('/instagram_api', (req, res) => {
            var need_login = true
            if (req.session.authenticated) {
                console.log("User access_token: " + req.session.access_token)
                need_login = false
                //retrieve follower list here
                //Since April 4th, Instagram has disabled this api. 
                //Can no longer do this
                //However just leave code here as framework

            }
            var props = {
                title: 'Instagram App',
                need_login: need_login,
                type: 'official',
                auth_link: auth_link
            }
            const appString = ReactDOMServer.renderToString( < InstagramLoginAPI { ...props
                }
                />);

                res.send(appString);
            })


        //Handle Login
        app.get('/accesstoken', (req, res) => {
            var code = req.query.code
            if (typeof code != 'undefined') {
                console.log("Login successfully. Code: " + code)
                //Get login code successfully, now send a post request to instagram api
                //to retrieve access token for further applications
                request.post({
                        url: 'https://api.instagram.com/oauth/access_token',
                        form: {
                            client_id: instagram_config.client_id,
                            client_secret: instagram_config.client_secret,
                            grant_type: "authorization_code",
                            redirect_uri: instagram_config.redirect_uri,
                            code: code
                        }
                    }, (err, res1, body) => {
                        req.session.authenticated = true
                        req.session.access_token = JSON.parse(body).access_token
                        //save token as cookie
                        res.redirect("/")
                    }

                )
            } else
                res.redirect("/")

        })


app.listen(8080, () =>
    console.log("Web app running at 8080")
)