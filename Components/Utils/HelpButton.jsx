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

export default class HelpButton extends Component {
  state = {
    modalVisible: false
  };

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  render() {
    const { modalVisible } = this.state;
    return (
      <View style={styles.cornerView}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            this.setModalVisible(!modalVisible);
          }}
        >
            <ScrollView >
          <View style = {styles.buttonTextView}>
            <View style={styles.modalView}>
              <Text style = {{fontWeight:'bold', marginTop:-35, fontSize: 30, marginBottom: 25}} >
              Texas hold 'em
              </Text>
              <Text style={styles.modalText}>
                
                • In a game of Texas hold'em, each player is dealt 
                two cards face down (the 'hole cards') 
                {'\n'}
                {'\n'}
                •Throughout several betting rounds, five more cards
                 are (eventually) dealt face up in the middle of the table
                 {'\n'}
                 {'\n'}
                 •These face-up cards are called the 'community cards.' Each
                  player is free to use the community cards in combination 
                  with their hole cards to build a five-card poker hand.
                  {'\n'}
                  {'\n'}
                  •Your mission is to construct your five-card poker hands 
                  using the best available five cards out of the seven total
                  cards (the two hole cards and the five community cards).
                  You can do that by using both your hole cards in combination with three 
                  community cards, one hole card in combination with four community cards, 
                  or no hole cards.If the cards on the table lead to a better combination,
                   you can also play all five community cards and forget about yours.
                  {'\n'}
                  {'\n'}
                  <Text style = {{fontWeight: 'bold'}} onPress = {() => Linking.openURL(
                    'https://www.pokernews.com/poker-rules/texas-holdem.htm')} >
                    For more info about Texas hold 'em please click me!
                  </Text>


              </Text>

              <Image
               style = {{borderColor: 'white', borderWidth: 2, marginBottom: 5}}
                source = {require('../../assets/communityCards.png')}
              />
              <Image
              style = {{borderColor: 'white', borderWidth: 2}}
              source = {require('../../assets/poker_hands.png')}
              />
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => this.setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>EXIT</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </Modal>

        <TouchableOpacity
          style={[styles.button, styles.buttonOpen, {paddingHorizontal: 20}]}
          onPress={() => this.setModalVisible(true)}
        >
          <Text style={styles.textStyle}>Rules</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
 
  cornerView: {
    justifyContent: "flex-end",
    alignSelf: 'flex-end'
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
    elevation: 5
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
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 35,
    marginLeft: -50,
    marginRight: -50,
    textAlign: "left",
    fontSize: 20
  }
});

