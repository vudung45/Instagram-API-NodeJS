var React = require('react')

class Profile extends React.Component {
  constructor(props)
  {
    super(props)
    this.state  = {userdata : props.userdata, showFollowings: false, followings_detailed:{} ,is_loading: false}
    this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps,state)
  {
    this.state.userdata = nextProps.userdata
    return true
  }


  handleClick(event)
  {
    this.setState({followings_detailed:{}, is_loading:true})
    fetch('/getFollowings',
    {
      method:'GET',
      credentials: 'include',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    }).then(response => response.json())
    .then(json => {
          if(json.success)
          {
            if(json.data != null)
            {
              try
              {
                var users_list = json.data["users"]
                var followings_detailed = {}
                for(var i = 0; i < users_list.length; i++)
                {
                   followings_detailed[users_list[i].pk] = users_list[i]
                }
                this.setState({followings_detailed: followings_detailed, is_loading : false})
              } catch(e) {
                console.log(e)
              }
            }
          }
    }).catch(e =>
    {
      console.log("Error getting followings")
    })
    
    event.preventDefault()
  }

  render()
  {
    return(
      <div>
        <a> Name: {this.state.userdata.fullname} </a> <br />
        <a> <img src={this.state.userdata.profile_pic} /> </a> <br />
        <a href="/logout"> Logout </a>
        <br />
        <a href="" onClick={this.handleClick}> Get followings </a>
        <Followers message="" followings_detailed={this.state.followings_detailed} is_loading={this.state.is_loading }/>
      </div>
    )
  }
}

class Followers extends React.Component {
  constructor(props)
  {
    super(props)
     this.state  = {is_loading: this.props.is_loading, 
                    followings_detailed: this.props.followings_detailed}

      this.removeAll = this.removeAll.bind(this)
      this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps,state)
  {
    this.state.followings_detailed = nextProps.followings_detailed
    this.state.is_loading = nextProps.is_loading

    return true
  }

  removeAll(){
    //only stop when there is no followers left
    if(Object.keys(this.state.followings_detailed).length > 0)
    {
      var uid_to_unfollow = Object.keys(this.state.followings_detailed)[0]
      fetch('/unfollow?uid='+uid_to_unfollow,
        {
          method:'GET',
          credentials: 'include',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          }
        }).then(response => response.json())
        .then(json => {
            
            if(json.success)
            {
                var personinfo = this.state.followings_detailed[uid_to_unfollow]
                delete this.state.followings_detailed[uid_to_unfollow]
                this.setState({message: "Unfollowed: "+personinfo.full_name, followings_detailed: this.state.followings_detailed})
                setTimeout(this.removeAll(), 1500) //try again in 1secs
            }
            else 
            {
                this.setState({message: "Something went wrong!!!"});
            }
        }).catch(e =>
        {
            console.log(e)
            this.setState({message: "Something went wrong!!!"});
  
        })
    } else 
    {
         this.setState({message: "You have no followings left!!!"});
    }

  }

  handleClick(event){
    event.preventDefault()

    this.removeAll()
  }

  render()
  {
    var a = []
    var i = 1
    for (var uid in this.state.followings_detailed)
    {
      a.push(<a>{i}. {this.state.followings_detailed[uid].full_name} - {this.state.followings_detailed[uid].username}
         <br /></a>)
      i++
    }
    return(
      <div style={{overflow:'scroll', height:'400px'}}>
        <a>{this.state.message}<br /></a>
        { Object.keys(this.state.followings_detailed).length == 0 ? "" : 
          <a href='' onClick={this.handleClick} >Remove All Followings <br /></a>
        }
        {this.state.is_loading ? "Loading..." : a }
      </div>
    )
  }
}

class CustomAuth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {username: '', password: '', message: '', isLoggedIn: true, userdata:
      {
        userid : '',
        username : '',
        fullname : '',
        profile_pic : ''
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event,type) {
    if(type == 'username')
      this.setState({username: event.target.value});
    if(type == 'password')
      this.setState({password: event.target.value});

  }

  componentDidMount()
  {
    this.loadApi((data) =>
    {
        if(data != null){
          if(data.isLoggedIn){
            this.setState({isLoggedIn: true, userdata: data.userdata})
          }
          else
          {
            if(this.state.isLoggedIn)
                this.setState({isLoggedIn: false, userdata: data.userdata})
          }
        }
    })
  }


  loadApi(callback){
    fetch('/localapi',
    {
      method:'GET',
      credentials: 'include',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    }).then(response => response.json())
    .then(json => {
          callback(json)
    }).catch(e =>
    {
        callback(null)
    })
  }

  handleSubmit(event) {
    var username = this.state.username
    var password = this.state.password
    fetch('/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.state)
    }).then(response => response.json())
    .then(json =>
    {
      if(json.success)
        this.setState({message: 'Logged in successfully', userdata: json.userdata, isLoggedIn: true})
      else
      {
        this.setState({message: json.message})
      }
    }).catch(e =>
    {
      this.setState({message: "Something went wrong! Try again"})
    })
    event.preventDefault();
  }

  render() {
    var profileComponent = <Profile userdata={this.state.userdata} />
    return (
          <div>
            {this.state.isLoggedIn ? profileComponent :
            <div>
              <form>
                <p> This approach uses Unofficial Instagram API to retrieve data</p>
                <p> Please login with your Instagram account</p>

                <a style={{color:'red'}}>{this.state.message}</a><br />

                <label>
                  username:
                  <input type="text" value={this.state.value} onChange={(e) => this.handleChange(e,'username')} />
                </label>
                <br />
                <label>
                  password:
                  <input type="password" value={this.state.value} onChange={(e) => this.handleChange(e,'password')} />
                </label>
                <br />
                <input type="submit" onClick={this.handleSubmit} value="Submit" />
              </form>
            </div>}
          </div>
    );
  }
}

module.exports = CustomAuth