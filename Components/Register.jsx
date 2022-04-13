import React, { Component, useState } from 'react'
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, 
  TextInput, TouchableOpacity, Touchable, Alert } from 'react-native';
import Logo from './Utils/Logo';
import firebase from 'firebase'

export default class Register extends Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      email: '',
      password: '',
      time: '',
    }
  }

  async SignUp(){
    if(this.state.username.trim().length < 1){
      Alert.alert('No Name Entered', 'Please enter a valid name for yourself.')
      return
    } 
    firebase.auth().createUserWithEmailAndPassword(this.state.email.trim(), this.state.password.trim())
      .then((userCredential) =>{
        var user = firebase.auth().currentUser;
          if (user) {
            this.InitializeUserInDB(user, this.state.username.trim()+"#"+user.uid)
            user.updateProfile({
              displayName: this.state.username.trim(),
              photoURL: 'https://firebasestorage.googleapis.com/v0/b/pokerfriends-843ef.appspot.com/o/default_player_image.jpg?alt=media&token=8353b7ac-d6f0-4c6c-a379-712cb8cb48de'
            })
              .then(() => {
                this.props.navigation.navigate('LandingPage')
              })
              .catch(function(error) {
                console.log(error)
              })
          }
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      Alert.alert(errorCode, errorMessage);
    });
  }

  

  async InitializeUserInDB(user, username){
    firebase.database().ref('users/' + user.uid +'/data').set({
        daily_login: new Date().getDay(),
        chips: 1000,
        username: username,
        email: this.state.email,
        friends: [''],
        games: 0,
        wins: 0,
        chips_lost: 0,
        chips_won: 0,
        in_game: '',
        newAlert: false,
        photoURL: 'https://firebasestorage.googleapis.com/v0/b/pokerfriends-843ef.appspot.com/o/default_player_image.jpg?alt=media&token=8353b7ac-d6f0-4c6c-a379-712cb8cb48de'
    });

    firebase.database().ref('users/' + user.uid +'/request').set({
      friend_request: [''],
      friend_request_alert: false,
      friend_confirmed: ['']
    });
  }

  render(){
    return (
        <KeyboardAvoidingView style={styles.container}
          behavior={Platform.OS === "ios" ? "position" : "height"}
          contentContainerStyle={[styles.container, {marginBottom: -30}]}
        >
            <Logo />

            <TextInput
                placeholder="Username"
                placeholderTextColor="rgba(255, 255, 255, 0.75)"
                returnKeyType="next"
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType='username'
                maxLength={16}
                keyboardType='email-address'
                style={styles.input}
                onChangeText={text => this.setState({username: text.replace(/\s+/g, ' ').replace(
                  /[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ''
                )})}
                value={this.state.username}
            />

            <TextInput
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.75)"
                returnKeyType="next"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType='email'
                style={styles.input}
                onChangeText={text => this.setState({email: text})}
                value={this.state.email}
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.75)"
                returnKeyType="go"
                secureTextEntry
                autoCompleteType='password'
                style={styles.input} 
                onChangeText={text => this.setState({password: text})}
                value={this.state.password}
            />

            <TouchableOpacity style={styles.buttonContainer} onPress={() => this.SignUp()}>
                <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonContainer} onPress = {() => this.props.navigation.navigate('LandingPage')}>
                <Text style={styles.registerButtonText}>Go Back</Text>
            </TouchableOpacity>

        </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
      padding: 20,
      flex: 1,
      width: '100%',
      backgroundColor: '#2ecc71',
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttonContainer:{
      backgroundColor: '#27ae60',
      paddingVertical: 20,
      padding: 20,
      borderRadius: 50,
      width:"100%",
      marginBottom: 20
    },
    registerButtonText: {
      textAlign: 'center',
      color: '#FFF'
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
})