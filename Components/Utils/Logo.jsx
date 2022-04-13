import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView } from 'react-native';

export default class Logo extends Component {
    render(){
        return (
            <KeyboardAvoidingView style={styles.logoContainer}  
              //behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
            <Image 
              style={styles.logo} 
              source={require('../../assets/placeholderLOGO.png')}/>
  
            <Text style={styles.title}> Play Poker with friends! </Text>
          </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    logoContainer: {
      flex: 1,
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center'
    },
    logo: {
      width: 100,
      height: 100
    },
    title: {
      color: '#fff',
      marginTop: 10,
      textAlign: 'center',
      fontWeight: 'bold'
    }
  });
  