import React, { Component } from "react";
import { Image, 
        Alert, 
        Modal, 
        StyleSheet, 
        Text, 
        Pressable, 
        View, 
        TouchableOpacity,
        FlatList,
        } from "react-native";
import firebase from "firebase";

export default class Logout extends Component {
  state = {
    modalVisible: false
  };

  LogOut(){
    firebase.auth().signOut()
    .then(() => {
    // Sign-out successful.
    }).catch((error) => {
      console.log(error)
      // An error happened.
    });
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  render() {
    const { modalVisible } = this.state;
    return (
      <View style={{width: '100%', justifyContent: 'center'}}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
              this.setModalVisible(!modalVisible);
            }}
          >
            <View style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
              <Text style = {{
                flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
                fontWeight:'bold', marginTop:-35, fontSize: 30, marginBottom: 25}} >
                Are you sure you want to Log Out?
              </Text>

              <View styles={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                  <TouchableOpacity
                  onPress={() => {this.setModalVisible(!modalVisible); this.LogOut()}}
                >
                  <Text>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {this.setModalVisible(!modalVisible)}}
                >
                  <Text>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        
        <View>
          <TouchableOpacity style={styles.button2} 
            onPress = {() => this.setModalVisible(true)}>
                <Text style={styles.textStyle2}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  textStyle2:{
    alignItems: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  button2:{
    backgroundColor: '#27ae60',
    paddingVertical: 20,
    padding: 50,
    borderRadius: 50,
    width:"100%",
    marginBottom: 20
  },
  buttonTextView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    height: "auto",
    maxHeight: 500
  },
  button: {
    borderRadius: 50,
    padding: 10,
    elevation: 2
  },
  buttonOpen: {
    backgroundColor: "#27ae60",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
    marginTop:20
  },
  textStyle: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 35,
    marginLeft: -50,
    marginRight: -50,
    textAlign: "left",
    fontSize: 20
  },
  NotificationView: {
    justifyContent: "flex-end",
  },
  NotificationButton: {
    flexDirection: 'row',
    borderRadius: 50,
    padding: 10,
    elevation: 2,
  },
  NotificationtextStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    left: 5
  },
  NotificationClearButton: {
    borderRadius: 50,
    padding: 10,
    elevation: 2,
    backgroundColor: "#c80c0d"
  },
  NotificationButtonText:{
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  }
});

