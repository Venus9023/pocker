import React, { Component } from "react";
import { Image, 
        Alert, 
        Modal, 
        StyleSheet, 
        Text, 
        Pressable, 
        View, 
        TouchableOpacity,
        ScrollView,
        Linking} from "react-native";
import firebase from 'firebase'

export default class Balance extends Component {
  render() {
    return (
      <View style={styles.cornerView}>
        <TouchableOpacity style={styles.button} disabled={true}>
          <Text style={styles.textStyle}>{this.props.chips +" Chips"}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  cornerView: {
    justifyContent: "flex-start",
    alignSelf: 'flex-start',  
    paddingRight: 5
  },
  button: {
    borderRadius: 50,
    padding: 10,
    elevation: 2,
    backgroundColor: "#27ae60"
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});

