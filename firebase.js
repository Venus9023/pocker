
//@refresh reset
import firebase from 'firebase';
import 'firebase/firebase-auth'

const firebaseConfig = {
    apiKey: "AIzaSyBVr4IKgejWBb6uFG_joH5a5tT03j40NRM",
    authDomain: "pokerfriends-843ef.firebaseapp.com",
    databaseURL: "https://pokerfriends-843ef-default-rtdb.firebaseio.com/",
    projectId: "pokerfriends-843ef",
    storageBucket: "pokerfriends-843ef.appspot.com",
    messagingSenderId: "1077794174230",
    appId: "1:1077794174230:web:f05b745f8fba6d8f798c37"
  };
  
if(firebase.apps.length === 0){
  firebase.initializeApp(firebaseConfig);
  console.log('firebase.js triggered')
}







