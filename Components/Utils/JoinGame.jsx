import firebase from 'firebase'
import {setStatusBarHidden } from 'expo-status-bar';

export async function joinGame(matchName, chips, navigation){
  var user = firebase.auth().currentUser;
  const username = user.displayName
  const matchType = matchName.substring(0, matchName.indexOf("_"));
  const matchPath =  '/games/' + matchType + '/' + matchName;
  
  firebase.database().ref(matchPath).once('value', (snapshot) => {
    console.log('game data recieved')
    var data = snapshot.val()
    data.balance.push(data.buyIn)
    data.players.push(username)
    data.playerAvatar.push(user.photoURL)
    data.move.push('waiting')
    data.round.push(0)
    data.newPlayer +=1
    data.size += 1

    chips -= data.buyIn
    
    var updates = {};
    
    updates['/users/'+ user.uid +'/data/in_game'] = matchName
    updates['/users/'+ user.uid +'/data/chips'] = chips

    updates[matchPath + '/balance'] = data.balance
    updates[matchPath + '/players'] = data.players
    updates[matchPath + '/playerAvatar'] = data.playerAvatar
    updates[matchPath + '/move'] = data.move
    updates[matchPath + '/round'] = data.round
    updates[matchPath + '/newPlayer'] = data.newPlayer
    updates[matchPath + '/size'] = data.size

    
    updates['/games/list/' + matchName + '/size'] = data.size

    firebase.database().ref().update(updates);
    setStatusBarHidden(true, 'slide');
    navigation.navigate('GameController')
  })
}