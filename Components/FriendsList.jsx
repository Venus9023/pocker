import React, { Component } from 'react'
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, TextInput, SafeAreaView, StatusBar,
  TouchableOpacity, Touchable, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import firebase from 'firebase'
import AccountStats from "./AccountStats";
import { joinGame } from './Utils/JoinGame'


export default class FriendsList extends Component {
  constructor(props){
    super(props)
    this.state = {
      ready: false,
      friends: null,
      friendSize: this.props.userData.friends.length - 1,
      friendData: [],

      searchEmail: '',
      foundUser: false,
      foundUserData: {},
      foundUserRequest: [],
      foundModalVisible: false,
      userAbleAdd: true,

      requestModalVisible: false,
      confirmFriend:'',

      mangageFriendsVisible: false,
      removeFriendsOn: false
    }
  }

  componentDidMount(){
    var user = firebase.auth().currentUser;
    firebase.database().ref("/users/"+ user.uid + "/data/friends").on("value", (snapshot) => {
      var data = snapshot.val().slice(1);
      this.setState({ready: false, friends: data}, () => this.GetData());
    });
   }

   componentWillUnmount(){
    //stops checking for updates on list
    firebase.database().ref('/users').off()
  }

  async GetData(){
    var data = []
    var updates = {}
    var removeFriend = []
    var promises = []
    var user = firebase.auth().currentUser;

    if(this.state.friends.length > 0){
      this.state.friends.forEach((fullName, index) => {
        var uid = fullName.slice(fullName.indexOf('#')+1)
        var name = fullName.slice(0, fullName.indexOf('#'))
        var name2 = name
        promises.push(new Promise ((resolve, reject) => {
          firebase.database().ref('/users/'+ uid + '/data').once('value', (snapshot) => {
            if(snapshot.val() != null){
              name2 = snapshot.val().username.slice(0, snapshot.val().username.indexOf('#'))
              if(name != name2){ //friend updated name
                name = name2
                updates['/users/'+user.uid+'/data/friends/'+(index+1)] = snapshot.val().username
              } 
              data.push({key: name, ...snapshot.val()})
            }
            else{ //friend no longer exists 
              removeFriend.push(index+1)
            }
            resolve("success")
          })
        }))
      })

      await Promise.all(promises).then(()=>{
        this.setState({friendData:data, ready: true})   
        if(removeFriend.length > 0){
          updates['/users/'+user.uid+'/data/friends'] = this.props.userData.friends.filter((friend, index) => !removeFriend.includes(index))
        }
        if (Object.keys(updates).length > 0) {
          firebase.database().ref().update(updates);
        }
      })
    }
    else{
      this.setState({ready: true, friendData: []})
    }
  }

  FindUser(){
    var searchEmail = this.state.searchEmail.trim()
    this.setState({searchEmail: ''})

    firebase.database().ref('/users').orderByChild("/data/email").equalTo(searchEmail).limitToFirst(1).once('value', (snapshot) => {
      if(snapshot.val() == null){
        Alert.alert('Not Found','A user was not found with email entered')
        this.setState({foundUser: false})
        return
      }

      var id = Object.keys(snapshot.val())[0]
      var foundUserData = snapshot.val()[id].data
      var foundUserRequest = snapshot.val()[id].request
      var userAbleAdd = true

      console.log(foundUserData, foundUserRequest)


      if(foundUserData.friends.includes(this.props.userData.username)){
        Alert.alert('Cannot Add','Already friends with user')
        userAbleAdd = false
      }
      else if(-1 != foundUserRequest.friend_request.findIndex(obj => obj.username == 
        this.props.userData.username)){
        Alert.alert('Cannot Add','Friend Request already sent')
        userAbleAdd = false
      }
      else if(foundUserData.username === this.props.userData.username){
        Alert.alert('Cannot Add','You cannot add yourself!')
        userAbleAdd = false
      }
      /* else if(){

      } */
      else{
        this.setState({foundUser: true,
          foundUserData: foundUserData, 
          foundUserRequest: foundUserRequest,
          userAbleAdd: userAbleAdd,
          foundModalVisible: true
        })
      }
    })
  }

  SendFriendRequest(){
    this.setState({userAbleAdd: false})
    this.state.foundUserRequest.friend_request.push({username: this.props.userData.username, photoURL: this.props.userData.photoURL})
    var updates = {};

    const friendID = this.state.foundUserData.username.slice(this.state.foundUserData.username.indexOf('#')+1)
    updates['/users/'+ friendID +'/request/friend_request'] = 
      this.state.foundUserRequest.friend_request
    updates['/users/'+ friendID +'/request/friend_request_alert'] = true
    firebase.database().ref().update(updates);
  }

  async RespondFriendRequest(friendName, accept){
    var user = firebase.auth().currentUser;

    var updates = {}
    var newFriendRequest = this.props.userRequest.friend_request
    newFriendRequest.splice(this.props.userRequest.friend_request.indexOf(friendName), 1)
    updates['/users/'+ user.uid +'/request/friend_request'] = newFriendRequest
    
    if(accept){
      const friendID = friendName.slice(friendName.indexOf('#')+1)
      //FETCH FRIEND INFO AND PUSH IT 
      var friend_confirmed = await firebase.database().ref('/users/'+ friendID + '/request/friend_confirmed').once('value').then((snapshot) => {  
        return snapshot.val()
      })
      if(friend_confirmed !== null){ //Friend exists
      var newFriends = this.props.userData.friends
      newFriends.push(friendName)
      updates['/users/'+ user.uid +'/data/friends'] = newFriends

      friend_confirmed.push(this.props.userData.username)
      updates['/users/'+ friendID +'/request/friend_confirmed'] = friend_confirmed
      }
      else{
        Alert.alert('User: '+ friendName, 'This user no longer exists. The user has deleted their account.')
      }
    }

    firebase.database().ref().update(updates);
  }

  DisplayFoundUser(){
      return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.foundModalVisible}
      >
        <View style={[styles.friendRequestBubble,  {backgroundColor: "white", marginTop: 50}]}>
          <View style={{flexDirection: 'row' , justifyContent: 'center'}}>
            <Image source={{ uri: this.state.foundUserData.photoURL }} style = {styles.avatarImage}/>
          </View>

          <Text style={[styles.textStyleDark, {fontSize: 20}]}>
            {this.state.foundUserData.username.slice(0, this.state.foundUserData.username.indexOf('#'))}
          </Text>

          <View style = {{padding: 5}}></View>
          <TouchableOpacity
            disabled={!this.state.userAbleAdd}
            style={[styles.buttonRequest, (this.state.userAbleAdd)?{backgroundColor: '#2e8fff'}:styles.disabled]}
            onPress={() => {this.SendFriendRequest(); this.setState({foundModalVisible: false })}}
          >
            <Text style={styles.textStyle}>ADD</Text>
          </TouchableOpacity>
          
          <View style = {{padding: 5}}></View>
          <TouchableOpacity
            style={[styles.buttonRequest, {backgroundColor: "#c80c0d"}]}
            onPress={() => this.setState({foundModalVisible: false })}
          >
            <Text style={styles.textStyle}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      )
  }
  
  DisplayFriendRequest(){
    var friendRequests = this.props.userRequest.friend_request.slice(1)
  
    return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.requestModalVisible}
      >
        <View style = {styles.modalView}>
          {friendRequests.length == 0? (
              <Text style={[styles.titleButtonStyle, {color:'black'}]}>No Friend Requests</Text>
          ):(
          <FlatList style={{width:'100%'}}
            data={friendRequests}
            keyExtractor={(item)=>item.username}
            renderItem={({item})=>{
              return(
                <View style={styles.friendRequestBubble}>
                  <View style={{flexDirection: 'row' , justifyContent: 'center'}}>
                    <Image source={{ uri: item.photoURL}} style = {styles.avatarImage}/>
                  </View>

                  <Text style={[styles.textStyleDark, {fontSize: 20}]}> {item.username.slice(0, item.username.indexOf('#'))}</Text>
                  
                  <View style={{flexDirection: "row", justifyContent: "space-evenly"}}>
                    <TouchableOpacity
                      style={[styles.buttonRequest, {backgroundColor: '#2e8fff'}]}
                      onPress={() => { this.RespondFriendRequest(item.username, true)} }
                    >
                      <Text style={styles.textStyle}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.buttonRequest, {backgroundColor: "#c80c0d"}]}
                      onPress={() => { this.RespondFriendRequest(item.username, false)} }
                    >
                      <Text style={styles.textStyle}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>)
            }}
              />
            )}
            
            
            <View style = {{padding: 5}}></View>
            <TouchableOpacity
              style={styles.buttonRequest}
              onPress={() => this.setState({requestModalVisible: false })}
            >
              <Text style={styles.textStyleDark}>EXIT</Text>
            </TouchableOpacity>
        </View>
      </Modal>
    </View>
    )
  }

  async RemoveFriend(username){
    var user = firebase.auth().currentUser;

    var friendID = username.slice(username.indexOf('#')+1)
    var newFriendsList = this.props.userData.friends
    newFriendsList.splice(this.props.userData.friends.indexOf(username), 1)

    var updates = {}
    updates['/users/'+ user.uid +'/data/friends'] = newFriendsList
    updates['/users/'+ friendID +'/request/friend_delete'] =  [this.props.userData.username]

    firebase.database().ref().update(updates);
  }

  RemoveFriendButton(friendName, fullFriendName){
    return(
      <TouchableOpacity 
        style={styles.removeFriendButton} 
        onPress={() => this.RemoveFriend(fullFriendName)}
      >
          <Text style={styles.textStyle}>Remove {friendName}</Text>
      </TouchableOpacity>
    )
  }

  setRequestModalVisible = () => {
    this.setState({ requestModalVisible: true });
  }

    render(){
      if(this.state.ready){
        return (
          <SafeAreaView style={{flex:1, backgroundColor: '#2ecc71'}} >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={styles.container} 
              >
                {this.state.foundModalVisible && this.DisplayFoundUser()}
                {this.state.requestModalVisible && this.DisplayFriendRequest()}
                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.setState({mangageFriendsVisible: !this.state.mangageFriendsVisible})}
                  >
                    <Text style={styles.titleButtonStyle}>Manage Friends</Text>
                </TouchableOpacity>
                
                {!this.state.mangageFriendsVisible? (
                  <View></View>
                ):( 
                  <View style={{width: '100%'}}>
                    <TextInput
                      style={styles.input} 
                      placeholder="Find Friend via Email"
                      placeholderTextColor="rgba(255, 255, 255, 0.75)"
                      returnKeyType="next"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={'email-address'}
                      onChangeText={text => this.setState({searchEmail: text})}
                      value={this.state.searchEmail}
                    />
                      
                    <TouchableOpacity style={styles.buttonContainer}
                      disabled = {this.state.searchEmail.length < 1}
                      onPress={() => this.FindUser()}
                    >
                      <Text style={styles.textStyle}>Find</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.buttonContainer}
                      onPress={() => this.setRequestModalVisible()}
                    >
                      <Text style={styles.textStyle}>Friend Requests: {this.props.userRequest.friend_request.length - 1}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.buttonContainer, (this.state.removeFriendsOn)?{backgroundColor: '#c80c0d'}:{}]}
                      onPress={() => this.setState({removeFriendsOn: !this.state.removeFriendsOn})}
                    >
                      <Text style={styles.textStyle}>Remove Friend</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{flex:1, alignContent:'center', justifyContent:'center', paddingBottom: 10, width: '100%'}}>
                  <Text style={styles.titleTextStyle}>Friends:</Text>
                  <FlatList
                    horizontal={false}
                    numColumns={2}
                    data={this.state.friendData}
                    keyExtractor={(item)=>item.key}
                    renderItem={({item})=>{
                      var gameName = item.in_game.slice(0, item.in_game.indexOf('-'))
                      var inGame = gameName.length > 0
                      return(
                        <View style={styles.friendListContainer}>
                          <View style={{flexDirection: 'row' , justifyContent: 'center'}}>
                            <Image
                              source={{ uri: item.photoURL }}
                              style = {styles.avatarImage}/>
                          </View>
                          
                          {this.state.removeFriendsOn? (
                            this.RemoveFriendButton(item.key, item.username)
                            ):(
                            <Text style={styles.titleTextStyle}>{item.key}</Text>
                          )}

                          {inGame? (<View>
                            <Text style={[styles.textStyle, {marginBottom: 5}]}>Game: {gameName}</Text> 
                            <TouchableOpacity style={styles.joinButton}
                            onPress={() => joinGame(item.in_game, this.props.userData.chips, this.props.navigation)}>
                              <Text style={styles.joinTextStyle}>Join Game</Text>
                            </TouchableOpacity>
                          </View>
                          ):(<Text style={styles.textStyle}>Not in a game.</Text>)}
                        </View>
                      )
                    }}
                  />
                </View>

                <TouchableOpacity style={styles.buttonContainer}
                onPress={() => this.props.navigation.navigate('LandingPage')}>
                    <Text style={styles.textStyle}>Go Back</Text>
                </TouchableOpacity>

            </KeyboardAvoidingView>
          </SafeAreaView>
        );
      }
      else{
        return(
          <View style={[styles.container, styles.horizontal] }>
            <ActivityIndicator size='large' color="#FB6342"/>
          </View>
        )
      }
    }
}

const styles = StyleSheet.create({
    container: {
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight+5 : 0,
      padding: 20,
      flex: 1,
      backgroundColor: '#2ecc71',
      alignItems: 'center',
      justifyContent: 'center'
    },
    centeredView: {
      //flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    input: {
      height:40,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      marginBottom: 20,
      color: '#FFF',
      paddingHorizontal: 20,
      paddingEnd: 10,
      borderRadius: 50,
      width:'100%'
    },
    sendButtonText: {
      textAlign: 'center',
      color: '#FFF',
      fontWeight: '900'
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center"
    },
    textStyleDark: {
      color: "black",
      fontWeight: "bold",
      textAlign: "center"
    },
    titleTextStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 20,
      marginBottom: 10
    },
    titleButtonStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 20
    },
    buttonStyle: {
      borderRadius: 2,
      padding: 10,
      elevation: 2,
      backgroundColor: "#b2bec3",
      marginTop: 5
    },
    buttonRequest: {
      borderRadius: 20,
      padding: 10,
      elevation: 2,
      marginTop: 5,
      backgroundColor: "#cccccc",
    },
    buttonContainer:{
      backgroundColor: '#27ae60',
      paddingVertical: 20,
      padding: 20,
      borderRadius: 50,
      width:"100%",
      marginBottom: 20
    },
    disabled:{
      backgroundColor: "#cccccc"
    },
    friendRequestBubble:{
      justifyContent: "center",
      alignContent: 'center',
      width: "85%",
      backgroundColor: "#e0e0e0",
      padding: 20,
      paddingEnd: 20,
      marginLeft: 20,
      borderRadius: 30,
      marginBottom: 10
    },
    modalView: {
      margin: 20,
      marginTop: 50,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    friendListContainer: {
      backgroundColor: '#27ae60',
      borderRadius: 30,
      textAlign: 'center',
      justifyContent: 'center',
      alignContent: 'center',
      width: "45%",
      padding: 10,
      margin: 10
    },
    joinButton:{
      backgroundColor: '#000000',
      borderRadius: 50,
      width:"95%",
      marginLeft: 5
    },
    joinTextStyle: {
      padding: 5,
      color: "white",
      textAlign: "center"
    },
    avatarImage: {
      width: 80, 
      height: 80, 
      borderRadius: 100,
      marginBottom: 10,
      justifyContent: 'center',
    },
    removeFriendButton:{
      backgroundColor: '#c80c0d',
      paddingVertical: 20,
      padding: 20,
      borderRadius: 50,
      width:"100%",
      marginBottom: 20
    },
})