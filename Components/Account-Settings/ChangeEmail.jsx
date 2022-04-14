import React, { Component } from 'react'
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, TextInput, 
  TouchableOpacity, Touchable, Alert } from 'react-native';
import Logo from '../Utils/Logo';
import firebase from 'firebase'

export default class ChangeEmail extends Component {
  constructor(props){
    super(props)
    var user = firebase.auth().currentUser;
    this.state = {
      email: '',
      oldEmail: user.email
    }
  }

  Update(){
    var user = firebase.auth().currentUser;
    var updates = {};

    user.updateEmail(this.state.email)
    .then(() =>{
      Alert.alert("Email changed","From: " + this.state.oldEmail + " to: " + this.state.email)
      updates['/users/'+ user.uid +'/data/email'] = this.state.email;
      firebase.database().ref().update(updates);
      this.props.navigation.navigate('AccountSettings')
    })
    .catch(function(error) {
       Alert.alert('Error:', error.message)
    });
  }
  
    render(){
        return (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container} 
              >
                <Logo />
                <TextInput
                    placeholder={this.state.oldEmail}
                    placeholderTextColor="rgba(255, 255, 255, 0.75)"
                    returnKeyType="next"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    ref={(input) => this.emailInput = input}
                    onChangeText={text => this.setState({email: text})}
                    value={this.state.email}
                />

                <TouchableOpacity style={styles.buttonContainer} onPress={() => this.Update()}>
                    <Text style={styles.sendButtonText}>Change Email</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonContainer}
                onPress={() => this.props.navigation.navigate('AccountSettings')}>
                    <Text style={styles.sendButtonText}>Go Back</Text>
                </TouchableOpacity>

            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      padding: 20,
      flex: 1,
      backgroundColor: '#2ecc71',
      alignItems: 'center',
      justifyContent: 'center'
    },
    input: {
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      marginBottom: 20,
      color: '#FFF',
      paddingHorizontal: 20,
      paddingEnd: 10,
      borderRadius: 50,
      width:"100%",
    },
    buttonContainer:{
      backgroundColor: '#27ae60',
      paddingVertical: 20,
      padding: 20,
      borderRadius: 50,
      width:"100%",
      marginBottom: 20
    },
    sendButtonText: {
      textAlign: 'center',
      color: '#FFF',
      fontWeight: '900',
    }
})