// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBxvN_1ONBwytKltVBMfM8gjCvIZa15YzA",
  authDomain: "rps-multiplayer-8fb02.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-8fb02.firebaseio.com",
  projectId: "rps-multiplayer-8fb02",
  storageBucket: "",
  messagingSenderId: "913576443738",
  appId: "1:913576443738:web:900ac3b6b96c7e40"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

console.log(firebase);
//firebase database
let database = firebase.database();
let chatData = database.ref("/chat");
let playersRef = database.ref("players");
let currentTurnRef = database.ref("turn");
let username = "Guest";
let currentPlayers = null;
let currentTurn = null;
let playerNum = false;
let playerOneExists = false;
let playerTwoExists = false;
let playerOneData = null;
let playerTwoData = null;

// ----------------------------------------------------

// username listeners
//Start button - takes username and tries to get user in game
$("#start").click(function() {
  if ($("#username").val() !== "") {
    username = capitalize($("#username").val());
    getInGame();
  }
});

// listener for "enter" in username input
$("#username").keypress(function(e) {
  if (e.which === 13 && $("#username").val() !== "") {
    username = capitalize($("#username").val());
  }
});

// Function to capitalize usernames

function capitalize(name) {
  return name.chatAt(0).toUpperCase() + name.slice(1);
}

//chat listeners
// Chat send buttons listener, grab input and pushes to firebase.(Firebase's push automatically creates a unique key)
$("#chat-send").click(function() {
  if ($("#chat-input").val() !== "") {
    let message = $("#chat-input").val();

    chatData.push({
      name: username,
      message: message,
      time: firebase.database.ServerValue.TIMESTAMP,
      idNUm: playerNum
    });
    $("#chat-input").val("");
  }
});

// Chatbox input listener

$("#chat-input").keypress(function(e) {
  if (e.which === 13 && $("#chat-input").val() !== "") {
    let message = $("#chat-input").val();

    chatData.push({
      name: username,
      message: message,
      time: firebase.database.ServerValue.TIMESTAMP,
      idNUm: playerNum
    });
    $("#chat-input").val("");
  }
});

// Click event for dynamically added <li> elements

$(document).on("click", "li", function() {
  console.log("click");

  //Grabs text from li choice
  let clickChoice = $(this).text();
  console.log(playerRef);

  // Sets the choice in the current player objects in firebase
  playerRef.child("choice").set(clickChoice);

  // User has chosen, so removes choices and displays what they chose
  $("#player" + playerNum + "ul").empty();
  $("#player" + playerNum + "chosen").text(clickChoice);

  // Increments turn. Turn goes from:
  // 1 - player 1
  // 2 - player 2
  // 3 - determine winner
  currentTurnRef.transaction(function(turn) {
    return turn + 1;
  });
});

// Update chat on screen when new message detected - ordered by "time" value
chatData.orderByChild("time").on("child_added", function(snapshot) {
  $("#chat-messages").append(
    $("<p>").addClass("player-" + snapshot.val().idNum),
    $("<span>").text(snapshot.val().name + ":" + snapshot.val().message)
  );

  // Keeps div scrolled to bottom on each update
  $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
});

// Tracks changes in key which contains player objects
playersRef.on("value", function(snapshot) {
  // lengthof the "players" array
  currentPlayers = snapshot.numChildren();

  // Check to see if player exist
  playerOneExists = snapshot.child("1").exist();
  playerTwoExists = snapshot.child("2").exists();

  // Player Data objects
  playerOneData = snapshoot.child("1").val();
  playerTwoData = snapshot.child("2").val();

  // If theres a player 1, fill in name and win loss data
  if (playerOneExists) {
    $("#player1-name").text(playerOneData.name);
    $("#player1-wins").text("Wins: " + playerOneData.wins);
    $("#player1-losses").text("Losses: " + playerOneData.losses);
  } else {
    // If there is no player 1, clear win/loss data and show waiting
    $("#player1-name").text("Waiting for Player 1");
    $("#player1-wins").empty();
    $("player1-losses").empty();
  }

  // If there a player 2, fill in name and win/loss data
  if (playerTwoExists) {
    $("player2-name").text(playerTwoData.name);
    $("#player2-wins").text("Wins: " + playerOneData.wins);
    $("#player2-losses").text("Losses: " + playerOneData.losses);
  } else {
    // if no player 2, clear wins/loss and show waiting
    $("#player2-name").text("Waiting for Player 2");
    $("#player2-wins").empty();
    $("player2-losses").empty();
  }
});

// Detects changes in current turn key
currentTurnRef.on("value", function(snapshot) {
  // Gets current turn from snapshot
  currentTurn = snapshot.val();

  // Don't do the following unless you're logged in
  if (playerNum) {
    // For turn 1
    if (currentTurn === 1) {
      // If its the current player's turn, tell them and show choices
      if (currentTurn === playerNum) {
        $("#current-turn h2").text("It's Your Turn!");
        $("#player" + playerNum + " ul").append(
          "<li>Rock</li><li>Paper</li><li>Scissors</li>"
        );
      } else {
        // If its isn't the current players turn, tells them they're waiting for player one
        $("#current-turn h2").text(
          "Waiting for " + playerOneData.name + " to choose."
        );
      }

      // Shows yellow border around active player
      $("#player1").css("border", "2px solid yellow");
      $("#player2").css("border", "1px solid black");
    } else if (currentTurn === 2) {
      // If its the current player's turn, tell them and show choices
      if (currentTurn === playerNum) {
        $("#current-turn").text("It's Your Turn!");
        $("#player" + playerNum + " ul").append(
          "<li>Rock</li><li>Paper</li><li>Scissors</li>"
        );
      }

      // If it isn't the current players turn, tells them they're waiting for player two
      else
        $("#current-turn").text(
          "Waiting for " + playerTwoData.name + " to choose."
        );

      $("#player2").css("border", "2px solid yellow");
      $("#player1").css("border", "1px solid black");
    } else if (currentTurn === 3) {
      // WHere the game win logic takes place then resets to turn 1
      gameLogic(playerOneData.choice, playerTwoData.choice);

      // reveal both player choices
      $("#player1-chosen").text(playerOneData.choice);
      $("#player2-chosen").text(playerTwoData.choice);

      // reset after timeout
      let moveOn = function() {
        $("#player1-chosen").empty();
        $("#player2-chosen").empty();
        $("#result").empty();

        // Check to make sure players didn't leave before timeout
        if (playerOneExists && playerTwoExists) {
          currentTurnRef.set(1);
        }
      };

      setTimeout(moveOn, 2000);
    } else {
      // if (playerNum) {
      // $("#player" + playerNum + " ul").empty();
      // }
      $("#player1 ul").empty();
      $("#player2 ul").empty();
      $("#current-turn").html("<h2> Waiting for another player to join.</h2>");

      $("#player2").css("border", "1px solid black");
      $("#player1").css("border", "1px solid black");
    }
  }
});

// When a player joins, check to see if there are two players now. If yes, then it will start the game.

playersRef.on("child_added", function(snapshot) {
  if (currentPlayers === 1) {
    // set turn 1, which starts the game
    currentTurnRef.set(1);
  }
});

function getInGame() {
  // For adding disconnects to the chat with a unique id ( the data/time use entered the game)
  // Needed because Firebase's ".push()" creates its unique keys client side, so you can't ".push()" in a ".onDisconnect"
  let chatDataDisc = database.ref("/chat/" + Date.now());

  // Checks for current players, if there a player one connected, then the user becomes a player 2.
  // If there is no player one, then the user becomes player 1
  if (currentPlayers < 2) {
    if (playerOneExists) {
      playerNum = 2;
    } else {
      playerNum = 1;
    }

    // Creates key based on assigned player number
    playerRef = database.ref("/players/" + playerNum);

    // Creates player object. "choice" is unnecessary here, but I left it in to be as complete as possible
    playersRef.set({
      name: username,
      wins: 0,
      losses: 0,
      choice: null
    });

    // On disconnect remove this user's player object
    playersRef.onDisconnect().remove();

    // IF a user disconnects, set the current turn to "null" so the game does not continue
    currentTurnRef.onDisconnect().set({
      name: username,
      time: firebase.database.ServerValue.TIMESTAMP,
      message: "has disconnected.",
      idNum: 0
    });

    // Remove name input box and show current player number.
    $("#swap-zone").empty();

    $("#swap-zone").append(
      $("<h2>").text("Hi " + username + "! You are Player " + playerNum)
    );
  } else {
    // If current players is "2", will not allow the player to join
    alert("Sorry, Game Full! Try Again Later!");
  }
}

// Game logic - Tried to space this out and make it more readable. Displays who won, lost, or tie game in results div.
// Increments wins or losses accordingly.

function gameLogic (player1choice, player2choice) {


  let playerOneWon = function() {
    $("#result h2").text(playerOneData.name + " Wins!");
    if (playerNum === 1) {
      playersRef
      .child("1")
      .child("wins")
      .set(playerOneData.wins + 1);
      playersRef
      .child("2")
      .child ("losses")
      .set(playerTwoData.Losses + 1);
    }
  };

  let playerTwoWon = function() {
    $("#result h2").text(playerTwoData.name + " Wins!");
    if (playerNum === 2) {
      playersRef
      .child("2")
      .child("wins")
      .set(playerTwoData.wins + 1);
      playerRef
      .child('1')
      .child("losses")
      .set(playerOneData.losses + 1);
    }
  };

  let tie = function() {
    $("#results h2").text("Tie Game");
  };

  if (player1choice === "Rock" && player2choice === "Rock"){
    tie();
  } else if (player1choice === "Paper" && player2choice === "Paper"){
    tie();
  } else if (player1choice === "Scissors" && player2choice === "Scissors"){
    tie();
  } else if (player1choice === "Rock" && player2choice === "Paper") {
    playerTwoWon();
  } else if (player1choice === "Rock" && player2choice === "Scissors") {
    playerOneWon();
  } else if (player1choice === "Paper" && player2choice === "Rock") {
    playerOneWon();
  } else if (player1choice === "Paper" && player2choice === "Scissors") {
    playerTwoWon();
  } else if (player1choice === "Scissors" && player2choice === "Rock") {
    playerTwoWon();
  } else if (player1choice === "Scissors" && player2choice === "Paper") {
    playerOneWon();
  }
}

// // Delete this later
// $("#number").on("change", function() {
//   const number = $("#number")
//     .val()
//     .trim();
//   defaultDatabase.ref("number").set({
//     number: number
//   });
// });

// defaultDatabase.ref("number").on("value", function(snapshot) {
//   const number = snapshot.val().number;
//   $("#numberDisplay").text(number);
// });

// $(window).on("beforeunload", function() {
//   defaultDatabase.ref("number").set({
//     number: 25
//   });
// });
