import React, { Component } from "react";
import {StyleSheet, View, Alert, ActivityIndicator} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import firebase from "firebase";
import _ from "lodash"

import GameView from "./GameAnimation/GameSetting";
import Deck from "./Decks";
const gameDeck = new Deck();

export default class GameSetting extends Component {
  constructor(props) {
    super(props);
    this.leaveGame = this.leaveGame.bind(this)
    this.updateGame = this.updateGame.bind(this)

    this.state = {
      matchName: "",
      matchType: "",
      game: {},
      myCards: [],
      playerNum: 0,

      deck: [],
      user: {},
      fullMatchName: "",
      host: false,
      ready: false,
      newPlayer: true,
      roundWinner: "",
      roundWinnerFound: false
    };
  }

  componentDidMount() {
    this.getData();
  }
  componentWillUnmount(){
    this.setState({ready: false})
  }

  async getData() {
    const fullMatchName = this.props.userData.in_game;
    if (fullMatchName === "") {
      Alert.alert("You have not Joined/Created Game. Going back to Home Page");
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      this.props.navigation.navigate("LandingPage");
    }

    var indexOfType = fullMatchName.indexOf("_");
    const matchType = fullMatchName.substring(0, indexOfType);
    const matchName = fullMatchName.substring(indexOfType + 1);

    this.setState({
      fullMatchName: fullMatchName,
      matchType: matchType,
      matchName: matchName,
    });
    this.gameData(matchType, fullMatchName);
  }

  async gameData(matchType, matchName) {
    firebase
      .database()
      .ref("/games/" + matchType + "/" + matchName)
      .on("value", (snapshot) => {
        const data = snapshot.val();
        console.log("game updated");
        this.checkHost(data);
        this.setState({ game: data }, () => this.gameTurnAction());

        //this.checkHost(data)
      });
  }

  checkHost(game) {
    //var game = this.state.game
    if (!this.state.host) {
      var playerNum = game.players.indexOf(
        this.props.userData.username.slice(
          0,
          this.props.userData.username.indexOf("#")
        )
      );
      var newPlayer = false;

      if (this.state.newPlayer) {
        //newPlayer is True by default
        if (playerNum >= game.size - game.newPlayer) {
          newPlayer = true;
        } else {
          newPlayer = false;
        }
      }
      this.setState({
        host: playerNum == 0,
        playerNum: playerNum,
        newPlayer: newPlayer,
      });
    }
  }

  /*
  turn = 0 //initial, shuffle cards and upload to database, 
  turn = 1 //buy in phase and distrute cards to players
  turn = 2 //place 3 cards on board, and players can fold/raise/check/call 
  turn = 3 //place 4th card, bet
  turn = 4 //place 5th card, bet
  turn = 5 //last turn and winner takes pot. RESET turn to 0
  */

  async gameTurnAction() {
    //check if all players are ready, by seeing if any player is not ready
    var game = { ...this.state.game };
    const allPlayersReady = !game.ready.includes(false);

    if (this.state.host) {
      console.log("game.turn = ", game.turn);
      var updates = {};
      const matchPath =
        "/games/" + this.state.matchType + "/" + this.state.fullMatchName;

      if (game.turn == 0) {
        if (game.newPlayer > 0) {
          for (var i = 0; i < game.newPlayer; i++) {
            game.wins.push(0);
            game.chipsIn.push(0);
            game.chipsLost.push(0);
            game.chipsWon.push(0);
            game.move[game.size - game.newPlayer + i] = 'check';
            game.ready.push(false);
          }

          updates[matchPath + "/wins"] = game.wins;
          updates[matchPath + "/move"] = game.move;
          updates[matchPath + "/chipsWon"] = game.chipsWon;
          updates[matchPath + "/chipsLost"] = game.chipsLost;
          updates[matchPath + "/chipsIn"] = game.chipsIn;
          updates[matchPath + "/ready"] = game.ready;
          updates[matchPath + "/newPlayer"] = 0;
        } else if (game.size == 1 || 
          Math.min(...game.balance) < game.blindAmount) {
          //waiting for users to leave/join
        } else {
          var cards = await this.giveOutCards();
          game.player_cards = cards[0];
          game.deck = cards[1];
          game.turn++;

          updates[matchPath + "/player_cards"] = game.player_cards;
          updates[matchPath + "/deck"] = game.deck;
          updates[matchPath + "/turn"] = game.turn;
          updates[matchPath + "/round"] = game.round.map(x => x+1)
          //prepare for game.turn == 1
        }
      } else if (game.turn < 5) {
        this.setState({
            myCards: game.player_cards[this.state.playerNum].myCards,
          });
        const allPlayersFolded = //does all players who folded or all in
          game.move.filter((move) => move != "fold" && move != "all in" && move != "waiting").length == 1;
        //^This line also works when the game.size is 1, thus ending the current round, and wait for new players.

        if (allPlayersReady || allPlayersFolded) {
          if (allPlayersFolded) {
            if(game.turn == 1){
              updates[matchPath + "/board"] = game.deck 
              updates[matchPath + "/deck"] = null
            }
            else if(game.turn < 4){
              console.log(game.board.push(...game.deck))
              updates[matchPath + "/board"] = game.board
            }
            updates[matchPath + "/turn"] = 5;
          } else {
            if (game.turn < 4) {
              if (game.turn == 1) {
                //prep for turn 2
                game.board = game.deck.splice(0, 3);
              } else {
                //prep for turn 3 and 4
                game.board.push(...game.deck.splice(0, 1));
              }
              updates[matchPath + "/board"] = game.board;
              updates[matchPath + "/deck"] = game.deck;
            }
            game.turn++;
            updates[matchPath + "/turn"] = game.turn;
          }

          updates[matchPath + "/ready"] = game.ready.fill(false);
          updates[matchPath + "/raisedVal"] = 0;
        }
      } 
      else if (game.turn == 5) {
        if(game.roundWinner == -1){
          game.size -= game.newPlayer;
          // Figure out who won and give them pot
          var values = await this.findRoundWinner(game);
          const roundWinner = values[0]
          var roundWinnerLength = roundWinner.length
          var roundWinnerNames = roundWinner.map(x => game.players[x]).join(' and ');
          const roundWinnerRank = values[1]
          console.log("Roundwinner is after function call: ", roundWinner);
          
          //put a for loop here for all round winners
          //game.pot /roundWinner.length for the array of winners
          for(var k = 0; k < roundWinnerLength; k++){
            game.balance[roundWinner[k]] += (game.pot/roundWinnerLength)
            game.chipsWon[roundWinner[k]] += (game.pot/roundWinnerLength)
            game.wins[roundWinner[k]] += 1;
          }

          for (var i = 0; i < (game.players.length-game.newPlayer); i++) {
            if (!roundWinner.includes(game.players[i])) {
              game.chipsLost[i] += game.chipsIn[i];
            }
          }

          updates[matchPath + "/roundWinnerRank"] = roundWinnerRank;
          updates[matchPath + "/roundWinner"] = roundWinnerNames
          updates[matchPath + "/balance"] = game.balance;
          updates[matchPath + "/chipsWon"] = game.chipsWon;
          updates[matchPath + "/wins"] = game.wins;
          updates[matchPath + "/chipsLost"] = game.chipsLost;
          updates[matchPath + "/pot"] = 0;
        }
        else if(allPlayersReady){
          game.smallBlindLoc += 1;
          
          if (game.smallBlindLoc == game.size) {
            game.smallBlindLoc = 0;
          }
          game.playerTurn = game.smallBlindLoc;

          updates[matchPath + "/roundWinner"] = -1;
          updates[matchPath + "/roundWinnerRank"] = "High Card";
          updates[matchPath + "/move"] = game.move.fill("check");
          updates[matchPath + "/playerTurn"] = game.playerTurn;
          updates[matchPath + "/chipsIn"] = game.chipsIn.fill(0);
          updates[matchPath + "/raisedVal"] = 0;
          updates[matchPath + "/smallBlindLoc"] = game.smallBlindLoc;
          updates[matchPath + "/ready"] = game.ready.fill(false);
          updates[matchPath + "/turn"] = 0;
          updates[matchPath + "/board"] = "";
        }
      }
      else { console.log("Something Wrong with GameTurnAction in GameController"); }

      if (Object.keys(updates).length > 0) {
        firebase.database().ref().update(updates);
      }
    } else {
      //all players but host
      if (this.state.newPlayer) {
        this.setState({ myCards: [{ suit: 'back', value: 2 }] });
      } else if (game.turn > 0) {
        this.setState({
          myCards: game.player_cards[this.state.playerNum].myCards,
       });
      }
    }
    this.setState({ ready: true });
  }

  async findRoundWinner(game) {
    // Assign ranks for players before sorting ranks in hand[] array
    // Loop through all players and assign them a rank
    const ranks = 
      ["Royal Flush", "Staight Flush", "Four of a Kind", "Full House", "Flush", 
      "Straight", "Three of a Kind", "Two Pair", "Pair", "High Card", "Uncontested Round"]

    var hands = [] //hands in play
    if(game.size-game.newPlayer == 1){
      return [[0], ranks[10]]
    }
    
    for (var i = 0; i < game.size; i++) {
      if (game.move[i] != "fold") {
        var completeCards = [];
        //convert player cards to int values instead of strings, as well as sorting them
        game.player_cards[i].myCards = this.cardToInt(game.player_cards[i].myCards)
        game.player_cards[i].myCards.sort(function (a, b) { return b.value - a.value; })

        completeCards.push(...game.player_cards[i].myCards);
        completeCards.push(...this.cardToInt(game.board));
        var hand = _.cloneDeep(completeCards)
        // Convert the array to numerical/int values to sort

        var rank1 = this.isRoyalFlush(hand) //straight flush, flush, straight
        var rank2 = this.isDubs(hand) //duplicates such as Pair, Full House, 4 of Kind.
        if (rank1[0] < rank2[0]) {
          game.player_cards[i].rank = rank1;
        }
        else if (rank1[0] > rank2[0]){
          game.player_cards[i].rank = rank2
        }
        else{
          var high = game.player_cards[i].myCards
          high.sort(function (a, b) {return b.value - a.value});
          game.player_cards[i].rank = [10, [high[0].value, high[1].value]]
        }
        hands.push(game.player_cards[i])
      }
      //make functions return the highest number of card that did rank
      //ex: 8, 8 makes 2 pair isDubs returns rank 2 pair with 8
      //ex: striaght with highest card
    }
    var roundWinner = 0;
    if(hands.length == 1){ //if all but 1 player folded or is left.
      roundWinner = game.player_cards.findIndex((element) => element == hands[0])
      return [[roundWinner], ranks[10]];
    }

    //hands is an array of players with game.players_cards[i].rank sorted by highest rank to lowest (1, 2, 3, 4, 5, 6, 7, 8, 9, 10 hand rankings in order)
    hands.sort(function (a, b) { return a.rank[0] - b.rank[0]; }); //sorts from small to big
    hands = hands.filter(hand => hand.rank[0] == hands[0].rank[0]); //filter out lesser ranked hands

    var roundWinner = 0;
    if (hands.length == 1) {
      roundWinner = game.player_cards.findIndex((element) => element == hands[0])
    }
    else if (hands.length > 1) {
      //compare the highest card in the players 5 cards rank
      console.log('rank comparison triggered', hands)
      hands.sort(function (a, b) { return b.rank[1][0] - a.rank[1][0]; }); //sorts from big to small
      hands = hands.filter(hand => hand.rank[1][0] == hands[0].rank[1][0]);
      if(hands.length > 1 && hands[0].rank[1].length > 1){
        //compare the 2nd card of a 2 pair or full house
        console.log('rank comparison lv2 triggered')
        hands.sort(function (a, b) { return b.rank[1][1] - a.rank[1][1]; }); //sorts from big to small
        hands = hands.filter(hand => hand.rank[1][1] == hands[0].rank[1][1]);

      }
      if(hands.length > 1){
        //each players cards largest card compared
        console.log('hand comparison triggered')
        hands.sort(function (a, b) { return b.myCards[0].value - a.myCards[0].value; }); //sorts from big to small
        hands = hands.filter(hand => hand.myCards[0].value == hands[0].myCards[0].value);

        if(hands.length > 1){
          //each players cards 2nd card compared
          console.log('hand comparison lv 2 triggered')
          hands.sort(function (a, b) { return b.myCards[1].value - a.myCards[1].value; }); //sorts from big to small
          hands = hands.filter(hand => hand.myCards[1].value == hands[0].myCards[1].value);
  
          if(hands.length > 1){ //Split pot because of Identical hands
            console.log('identical hands')
            var roundWinnerArr = []
            hands.forEach(hand => //find index of every winning hand 
              roundWinnerArr.push( //push into array with all winners
                game.player_cards.findIndex((element) => element == hand)
              )
            );
            return [roundWinnerArr, ranks[hands[0].rank[0] - 1]];
          }
        }
      }
      roundWinner = game.player_cards.findIndex((element) => element == hands[0])
    }
    
    return [[roundWinner], ranks[hands[0].rank[0] - 1]];
  }

  cardToInt(array){
    for (var j = 0; j < array.length; j++) {
      if (array[j].value == "J") {
        array[j].value = 11;
      }
      else if (array[j].value == "Q") {
        array[j].value = 12;
      }
      else if (array[j].value == "K") {
        array[j].value = 13;
      }
      else if (array[j].value == "A") {
        array[j].value = 14;
      }
      else{
      array[j].value = parseInt(array[j].value);
      }
    }
    return array
  }

  // Rank 1 -> 2,5,6
  isRoyalFlush(hand) {
    var rank = this.isStraightFlush(hand)
    var straightFlushCheck = rank[0] == 2
    if(!straightFlushCheck){
      return rank 
    }

    //if the highest card in the StraightFlush is 'A' which is 14 then
    //It has to be a Royal Flush
    var straightHasA = rank[1][0] == 14 
    if (straightHasA) {
      console.log(
        "Congratulations, Royal Flush!",
        royalCheck,
        straightFlushCheck
      );
      return [1, 14];
    }
    return rank;
  }

  // Rank 2 - Five cards in a row all suit
  isStraightFlush(hand) {
    var Straight = this.isStraight(hand) 
    var Flush = this.isFlush(hand)
    if (Straight[0] && Flush[0]) {
      console.log("Straight and Flush");
      return [2, [Straight[1]]];
    }
    else if(Flush[0]){
      console.log("Flush")
      return [5, [Flush[1]]];
    }
    else if(Straight[0]){
      console.log("Straight")
      return [6, [Straight[1]]];
    }
    else{
      return [20]; //ranks are 1-10. 20 is for none found
    }
  }

  // Rank 5 - Five cards all same suit but not in numerical order
  isFlush(hand) {
    hand.sort(function (a, b) {return a.suit - b.suit;}); //sorts from small to high

    var diamond = "♦";
    var diamondCounter = 0;

    var heart = "♥";
    var heartCounter = 0;

    var spade = "♠";
    var spadeCounter = 0;

    var club = "♣";
    var clubCounter = 0;
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].suit == diamond) {
        diamondCounter++;
      }
      if (hand[i].suit == heart) {
        heartCounter++;
      }
      if (hand[i].suit == spade) {
        spadeCounter++;
      }
      if (hand[i].suit == club) {
        clubCounter++;
      }
      if (
        diamondCounter == 5 ||
        heartCounter == 5 ||
        spadeCounter == 5 ||
        clubCounter == 5
      ) {
        console.log("Flush found, returning true for isFlush()");

        var suit
        if(diamondCounter == 5) {suit = diamond}
        if(heartCounter == 5) {suit = heart}
        if(spadeCounter == 5) {suit = spade}
        if(clubCounter == 5) {suit = club}
        
        // Convert the array to numerical/int values to sort
        hand = [...hand.filter(card => card.suit == suit)]
        hand.sort(function (a, b) {return b - a;});
        return [true, [hand[0]]];
      }
    }
    return [false]
  }

  // Rank 6 - Five cards in numerical order, but not of same suit
  isStraight(hand) {
    // Make an array removing duplicates (makes checking for straight easier)
    var uniqueHand = []
    hand.forEach((card,i) => uniqueHand[i] = card.value);
    uniqueHand = [...new Set(uniqueHand)];
    uniqueHand.sort(function (a, b) {return b - a;}); //sorts from high to small

    var counter = 0;
    var max = 0;
    // Check for decreasing values (straight)
    if (uniqueHand.length >= 5) {
      // A straight can only be made with 5 cards so the unique hand needs at least 5 cards
      for (var i = 0; i < uniqueHand.length-1; i++) {
        // Loop through unique hand
       if(uniqueHand[i] - uniqueHand[i + 1] == 1){
          if (counter == 0){ 
            //since we are going in reverse order, 1st in straight is largest number
            max = uniqueHand[i]
          }
          counter++;
          console.log('Counter', counter)
        } // Count how many times a sequence (e.g 14 13 or 9 8) is found
        else {
          counter = 0;
          console.log('counter = 0')
        }
        if (counter >= 4) {
          console.log("Straight");
          return [true, [max]]
        }
      }
    }
    return [false];
  }
  
  isDubs(hand){ //Rank 3,4,7,8,9
    hand.sort(function (a, b) {return b.value - a.value}); //sorts from highest to smallest
    //console.log("hand", hand)
    //Loop through hand array to see if 4 cards have the same value (4 of a kind) then return true if so
    //var totalCounter = [0, 0, 0, 0, 0, 0, 0]
     
    var excluded = []
    var count = []
    var dubNum = []
    var counter = 1
    for (var i = 0; i < hand.length; i++) {
      counter = 1;
      if(!excluded.includes(i)){
        for (var j = i + 1; j < hand.length; j++) {
          if (hand[i].value == hand[j].value){
            counter += 1
            excluded.push(j)
          }
        }
        if(counter > 1){
          count.push(counter)
          dubNum.push(hand[i].value)
        }
      }
    }
    var row3 = 0
    var row2 = 0
    var row3Num = []
    var row2Num = []

    for(var i = 0; i < count.length; i++){
      if (count[i] == 4) { //Rank 3
        console.log("4 of kind");
        return [3, dubNum[i]]
      }
      else if(count[i] == 3){
        row3 += 1 
        row3Num.push(dubNum[i])
      }
      else if(count[i] == 2){
        row2 += 1
        row2Num.push(dubNum[i])
      }
    }
    
    if((row3 > 0 && row2 > 0) || row3 > 1 ){
      console.log("Full House", row3, row2) //Rank 4
      return [4, [row3Num[0], row2Num[0]]]
    }
    else if(row3 > 0){ //Rank 7
      console.log("3 of Kind")
      return [7, [row3Num[0]]]
    }
    else if(row2 > 0){ //Rank 8
      if(row2 > 1){
        console.log("2 pair")
        return [8, [row2Num[0], row2Num[1]]]
      }
      console.log("pair") //Rank 9
      return [9, [row2Num[0]]];
    }
    else{
      return [20]
    }
  }

  async giveOutCards() {
    gameDeck.shuffle();

    var playerDecks = [];
    for (var i = 0; i < this.state.game.size * 2; i += 2) {
      playerDecks.push([gameDeck.cards.shift(), gameDeck.cards.shift()]);
    }
    //output: [ [card, card], [card, card] ]
    this.setState({ myCards: playerDecks[0] });

    var playerRanks = playerDecks.map((cards) => {
      var obj = {
        rank: 10,
        myCards: cards,
      };
      return obj;
    });
    //example output: [{rank: 10, myCards: [Card, Card]}, {rank: 10, myCards: [Card, Card]}]

    var deck = [];
    for (var i = 0; i < 5; i++) {
      deck.push(gameDeck.cards.shift());
    }
    //this.setState({deck: deck})
    //console.log(playerRanks, deck, 'GameDeck, /n',gameDeck)
    return [playerRanks, deck];
  }

  updateGame(type, amount) {
      var gameData = {...this.state.game}
      var playerNum = this.state.playerNum
      var matchType = this.state.matchType
      var matchName = this.state.matchName

      var game = {...gameData}
      var keys = []
      if(type === 'check'){
        game.move[playerNum] = type
        game.ready[playerNum] = true
        keys = ['move', 'playerTurn', 'ready']
      }
      else if(type === 'call'){
        game.move[playerNum] = type
        game.chipsIn[playerNum] += amount //what if you don't have enough chips Fix for Partial Calls
        game.pot += amount 
        game.balance[playerNum] -= amount
        game.ready[playerNum] = true
        keys = ['move', 'chipsIn', 'balance', 'pot', 'playerTurn', 'ready']
      }
      else if (type === 'fold'){
        game.move[playerNum] = type
        game.ready[playerNum] = true
        keys = ['move', 'playerTurn', 'ready']
      }
      else if (type === 'raise'){
        game.move[playerNum] = type
        game.chipsIn[playerNum] += amount
        game.raisedVal += amount 
        game.pot += amount 
        game.balance[playerNum] -= amount

        game.ready.fill(false) 
        game.ready[playerNum] = true
        keys = ['move', 'chipsIn', 'raisedVal', 'balance', 'pot', 'playerTurn', 'ready']
      }
      else if (type === 'all in'){
        game.move[playerNum] = type
        game.ready[playerNum] = true
        keys = ['move', 'playerTurn', 'ready']

        if(amount > 0){
          game.chipsIn[playerNum] += amount //what if you don't have enough chips Fix for Partial Calls
          game.pot += amount 
          game.balance[playerNum] -= amount
          keys.push('chipsIn', 'balance', 'pot')
        }
      }
      else if (type === 'small blind'){
        game.move[playerNum] = type
        game.chipsIn[playerNum] += amount //what if you don't have enough chips Fix for Partial Calls
        game.raisedVal += amount 
        game.pot += amount 
        game.balance[playerNum] -= amount
        game.ready[playerNum] = true
        keys = ['move', 'chipsIn', 'raisedVal', 'balance', 'pot', 'playerTurn', 'ready']
      }
      else if (type === 'big blind'){
        game.move[playerNum] = type
        game.chipsIn[playerNum] += amount //what if you don't have enough chips Fix for Partial Calls
        game.pot += amount 
        game.balance[playerNum] -= amount
        game.ready.fill(false) 
        game.ready[playerNum] = true
        keys = ['move', 'chipsIn', 'balance', 'pot', 'playerTurn', 'ready']
      }

      game.playerTurn++;
      //see if it's the last player's turn and change it to the first player's turn
      if(game.playerTurn >= game.size-game.newPlayer){
        game.playerTurn = 0;
      }

    var updates = {};
    var matchLocation = "/games/" + matchType + "/" + matchType + 
      '_' + matchName + "/";

    for (var i = 0; i < keys.length; i++) {
      updates[matchLocation + keys[i]] = game[keys[i]];
    }

    if (Object.keys(updates).length > 0) {
      firebase.database().ref().update(updates);
    }
  }

  leaveGame() {
    var playernum = this.state.playerNum
    var editGame = {...this.state.game}
    var matchType = this.state.matchType
    var fullMatchName = this.state.matchType+'_'+this.state.matchName
    var userData = this.props.userData
    var newPlayer = this.state.newPlayer

    var updates = {};
    var matchLocation = "/games/" + matchType + "/" + fullMatchName;
    var user = firebase.auth().currentUser;

    const quitBalance = editGame.balance[playernum];
    var games = userData.games + editGame.round[playernum]
    updates["/users/" + user.uid + "/data/in_game"] = ""; 
    updates["/users/" + user.uid + "/data/chips"] = userData.chips + quitBalance;

    editGame.balance.splice(playernum, 1);
    editGame.players.splice(playernum, 1);
    editGame.playerAvatar.splice(playernum, 1);
    editGame.move.splice(playernum, 1);
    editGame.round.splice(playernum, 1);
    editGame.size -= 1;

    if (newPlayer) {
      editGame.newPlayer -= 1;
      updates[matchLocation + "/balance"] = editGame.balance;
      updates[matchLocation + "/players"] = editGame.players;
      updates[matchLocation + "/playerAvatar"] = editGame.playerAvatar;
      updates[matchLocation + "/size"] = editGame.size;
      updates[matchLocation + "/newPlayer"] = editGame.newPlayer;
      updates[matchLocation + '/move'] = editGame.move
      updates[matchLocation + '/round'] = editGame.round

      updates["/games/list/" + fullMatchName + "/size"] = editGame.size;
    } 
    else {
      const wins = editGame.wins[playernum] + userData.wins
      const chipsWon = editGame.chipsWon[playernum];
      const chipsLost =
        editGame.chipsLost[playernum] + editGame.chipsIn[playernum];

      if(editGame.turn == 0 || (editGame.turn == 1 && editGame.chipsIn[playernum] == 0)){
        games = games - 1
        console.log(games)
      }

      var indexOfType = userData.in_game.indexOf("_")+1
      var indexOfId = userData.in_game.indexOf("-")
      var gameName = userData.in_game.slice(indexOfType, indexOfId)

      var leaveGameAlert 
      var change = (quitBalance - editGame.buyIn) //calculate how much you earned or lost in game
      if(change > 0){
        leaveGameAlert = "You have gained " + change + " chips after game " + gameName + "."
      }
      else if(change < 0){
        leaveGameAlert = "You have lost " + (change * -1) + " chips after game " + gameName + "."
      }
      else{
        leaveGameAlert = "You broke even in your last game, " + gameName + "."
      }
      
      if(userData.alerts == null){
        userData.alerts = [leaveGameAlert]
      } 
      else{
        userData.alerts.push(leaveGameAlert)
      }

      updates["/users/" + user.uid + "/data/wins"] = wins
      updates["/users/" + user.uid + "/data/games"] = games
      updates["/users/" + user.uid + "/data/chips_won"] =
        userData.chips_won + chipsWon;
      updates["/users/" + user.uid + "/data/chips_lost"] =
        userData.chips_lost + chipsLost;
      updates["/users/" + user.uid + "/data/newAlert"] = true;
      updates["/users/" + user.uid + "/data/alerts"] = userData.alerts

      if (editGame.size == 0) {
        //delete game
        //by setting the data of these location to NULL, the branch is deleted.
        //https://firebase.google.com/docs/database/web/read-and-write#delete_data
        updates[matchLocation] = null;
        if (matchType == "public") {
          updates["/games/list/" + fullMatchName] = null;
        }
      } else {
        //update game
        updates["/games/list/" + fullMatchName + "/size"] = editGame.size;
        
        if(editGame.smallBlindLoc >= editGame.size){
          editGame.smallBlindLoc = editGame.size-1
          updates[matchLocation + "/smallBlindLoc"] = editGame.smallBlindLoc;
        } 

        //see if it's the last player's turn and change it to the first player's turn
        if(editGame.playerTurn >= editGame.size-editGame.newPlayer){
          editGame.playerTurn = editGame.smallBlindLoc;
          updates[matchLocation + "/playerTurn"] = editGame.playerTurn;
        }
        

        editGame.wins.splice(playernum, 1);
        editGame.chipsWon.splice(playernum, 1);
        editGame.chipsLost.splice(playernum, 1);
        editGame.chipsIn.splice(playernum, 1);
        editGame.player_cards.splice(playernum, 1);
        editGame.ready.splice(playernum, 1);
        
        updates[matchLocation + "/ready"] = editGame.ready;
        updates[matchLocation + "/balance"] = editGame.balance;
        updates[matchLocation + "/players"] = editGame.players;
        updates[matchLocation + "/playerAvatar"] = editGame.playerAvatar;
        updates[matchLocation + "/size"] = editGame.size;
        updates[matchLocation + "/wins"] = editGame.wins;
        updates[matchLocation + "/chipsLost"] = editGame.chipsLost;
        updates[matchLocation + "/chipsIn"] = editGame.chipsIn;
        updates[matchLocation + "/chipsWon"] = editGame.chipsWon;
        updates[matchLocation + "/move"] = editGame.move;
        updates[matchLocation + "/player_cards"] = editGame.player_cards;
        updates[matchLocation + '/round'] = editGame.round
      }
    }
    firebase
      .database()
      .ref("/games/" + matchType + "/" + fullMatchName)
      .off();
    firebase.database().ref().update(updates);
  }

  render() {
    if (this.state.ready) {
      return (
        <GameView
          game={this.state.game}
          myCards={this.state.myCards}
          matchName={this.state.matchName}
          matchType={this.state.matchType}
          playerNum={this.state.playerNum}
          navigation={this.props.navigation}
          leaveGame={this.leaveGame}
          updateGame={this.updateGame}
        />
      );
    } else {
      return (
        <View style={[styles.container, styles.horizontal]}>
          <ActivityIndicator size="large" color="#FB6342" />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#2ecc71",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});
