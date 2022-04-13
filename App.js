import "react-native-gesture-handler";
import React, { Component, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ActivityIndicator,
  LogBox,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar as StatusBarExpo } from 'expo-status-bar';
import Firebaseinit from "./firebase"; //Intializes Firebase
import firebase from "firebase";

import LandingPage from "./Components/LandingPage";
import Register from "../PokerFriends/Components/Register";
import Login from "./Components/Login";
import ForgotPassword from "./Components/Account-Settings/ForgotPassword";
import GameSetting from "./Components/Game/GameAnimation/GameSetting";
import GameController from "./Components/Game/GameController";
import AccountSettings from "./Components/AccountSettings";
import ChangeUsername from "./Components/Account-Settings/ChangeUsername";
import ChangeEmail from "./Components/Account-Settings/ChangeEmail";
import DeleteAccount from "./Components/Account-Settings/DeleteAccount";
import FriendsList from "./Components/FriendsList";
import CreateGame from "./Components/CreateGame";
import JoinGamePage from "./Components/JoinGamePage";
import AccountStats from "./Components/AccountStats";
import ChangeAvatar from "./Components/Account-Settings/ChangeAvatar";
import Leaderboard from "./Components/Leaderboard";

const Stack = createStackNavigator();

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userData: {},
      userRequest: {},
      ready: false,
      LoggedIn: false,
    };

    firebase.auth().onAuthStateChanged((user) => {
      this.setState({ LoggedIn: !!user });
      this.setState({ ready: false });
      this.getData();
    });
  }

  async getData() {
    var user = firebase.auth().currentUser;
    if (user != null) {
      firebase
        .database()
        .ref("/users/" + user.uid)
        .on("value", (snapshot) => {
          if (snapshot.val() != null) {
            var data = snapshot.val().data;
            const request = snapshot.val().request;
            this.setState({
              userData: data,
              userRequest: request,
              LoggedIn: true,
              ready: true,
            });
            var updates = {};
            var newDate = new Date().getDate() //change this
            if(data.daily_login != newDate){
              //every new day you login you get more chips
              var dailyAlert = "Daily Login Bonus Awarded. + 200 Chips"
              data.chips += 200;
              data.daily_login = newDate
              
              if(data.alerts == null){
                data.alerts = [dailyAlert];
              }
              else{
                data.alerts.push(dailyAlert)
              }

              updates["/users/" + user.uid + "/data/chips"] = data.chips;
              updates["/users/" + user.uid + "/data/daily_login"] = data.daily_login;
              updates["/users/" + user.uid + "/data/newAlert"] = true;
              updates["/users/" + user.uid + "/data/alerts"] = data.alerts
            }
            if(request.friend_request_alert){
              request.friend_request_alert = false;
              var newRequestAlert = "You have new friend requests! Please Check the Friends Menu."
              if(data.alerts == null){
                data.alerts = [newRequestAlert];
              }
              else{
                data.alerts.push(newRequestAlert)
              }
              updates["/users/" + user.uid + "/request/friend_request_alert"] = false;
              updates["/users/" + user.uid + "/data/alerts"] = data.alerts
              updates["/users/" + user.uid + "/data/newAlert"] = true;
              
            }
            if (request.friend_confirmed.length > 1) {
              
              var newFriendsAlert = "You have new Friends: " +  
                request.friend_confirmed.slice(1).map(x => x.slice(0, x.indexOf('#'))).join(', ')
                + ".";
              if(data.alerts == null){
                data.alerts = [newFriendsAlert];
              }
              else{
                data.alerts.push(newFriendsAlert)
              }
              updates["/users/" + user.uid + "/data/alerts"] = data.alerts
              updates["/users/" + user.uid + "/data/newAlert"] = true;

              var newFriends = data.friends
              newFriends.push(
                ...request.friend_confirmed.slice(1)
              );

              updates["/users/" + user.uid + "/request/friend_confirmed"] = [""];
              updates["/users/" + user.uid + "/data/friends"] = newFriends;

              data.friends = newFriends
            }
            if(request.friend_delete != null){
              var newFriendList = data.friends.filter(friend => !request.friend_delete.includes(friend))
              updates["/users/" + user.uid + "/request/friend_delete"] = null;
              updates["/users/" + user.uid + "/data/friends"] = newFriendList;

              data.friends = newFriends
            }
            if (Object.keys(updates).length > 0) {
              firebase.database().ref().update(updates);
            }
          }
        });
    } else {
      this.setState({ userData: { chips: 0 }, ready: true });
    }
  }

  render() {
    if (this.state.ready) {
      return (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LandingPage">
              {(props) => (
                <LandingPage
                  {...props}
                  userData={this.state.userData}
                  LoggedIn={this.state.LoggedIn}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />

            <Stack.Screen name="FriendsList">
              {(props) => (
                <FriendsList
                  {...props}
                  userData={this.state.userData}
                  userRequest={this.state.userRequest}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="GameController">
              {(props) => (
                <GameController {...props} userData={this.state.userData} />
              )}
            </Stack.Screen>

            <Stack.Screen name="CreateGame">
              {(props) => (
                <CreateGame {...props} userData={this.state.userData} />
              )}
            </Stack.Screen>

            <Stack.Screen name="JoinGamePage">
              {(props) => (
                <JoinGamePage {...props} userData={this.state.userData} />
              )}
            </Stack.Screen>

            <Stack.Screen name="AccountStats">
              {(props) => (
                <AccountStats {...props} userData={this.state.userData} />
              )}
            </Stack.Screen>

            <Stack.Screen name="ChangeUsername">
              {(props) => (
                <ChangeUsername {...props} userData={this.state.userData} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Leaderboard" component={Leaderboard} />
            <Stack.Screen name="AccountSettings" component={AccountSettings} />
            <Stack.Screen name="ChangeEmail" component={ChangeEmail} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
            <Stack.Screen name="ChangeAvatar" component={ChangeAvatar} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    } else {
      return (
        <View style={[styles.container]}>
          <StatusBarExpo style="light"/>
          <ActivityIndicator size="large" color="#FB6342" />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center",
  },
});
