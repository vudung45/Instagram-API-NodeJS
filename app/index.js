var React = require('react')

class InstagramApp extends React.Component {

    constructor(props) {
        super(props)
    }
    render(){
        return (
            <html>
                <head>
                    <title>
                        {this.props.title}
                    </title>
                </head>
                <body>
                    <div>
                    {this.props.need_login ? this.props.type == 'official' ? <a href={this.props.auth_link}>Login to authorize this app to retrive your data</a> : <a></a> : "Your followers list: "}
                    </div>
                </body>
            </html>
        )
    }
}



module.exports = InstagramApp
