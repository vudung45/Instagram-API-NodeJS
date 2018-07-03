require('babel-register')({
    presets: [ 'react' ]
})

// Import the rest of our application.
module.exports = require('./webapp.js')