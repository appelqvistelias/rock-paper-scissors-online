document.addEventListener("DOMContentLoaded", () => {
    // UI setup
    const playerChoiceFeedback = document.querySelector(".player-choice");
    const opponentChoiceFeedback = document.querySelector(".opponent-choice");
    const resultFeedback = document.querySelector(".result");
    const gameStatusFeedback = document.querySelector(".game-status");
    const countdownHeading = document.querySelector(".countdown")
    const playerScoreElement = document.querySelector(".player-score");
    const opponentScoreElement = document.querySelector(".opponent-score");
    let playerScore = 0;
    let opponentScore = 0;

    // const socket = io("https://your-app-name.onrender.com"); // Connect to WebSocket server
    const socket = io(); // Run server using localhost
    let playerChoice = null;

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function updateUI(element, message) {
        element.textContent = message;
    }

    function playGame(choice) {
        playerChoice = choice;
        socket.emit("playerChoice", choice); // Send choice to server
        updateUI(gameStatusFeedback, "Waiting for opponent...");
    }
    
    function disableButtons(disable) {
        document.querySelectorAll('.buttons button').forEach(button => {
        button.disabled = disable;
        });
    }

    function enableButtons(enable) {
        document.querySelectorAll('.buttons button').forEach(button => {
        button.disabled = enable;
        });
    }

    function updateScore(result) {
        if (result === "You won!") {
            playerScore++;
            playerScoreElement.textContent = playerScore;
        } else if (result === "You lost!") {
            opponentScore++;
            opponentScoreElement.textContent = opponentScore;
        }
    }

    socket.on("waiting", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(false); // Keep buttons enabled while waiting for opponent
    });
    
    socket.on("startGame", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(false);
    });
    
    socket.on("waitingForChoice", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(true); // Disable buttons while waiting for opponent's choice
    });

    // Alert when opponent leaves the game.
    socket.on("opponentLeft", (message) => {
        updateUI(gameStatusFeedback, message);
    });

    // Event listeners for player choices
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

// Receive game result from server
socket.on("gameResult", (data) => {
    console.log("Received gameResult event:", data);
    const playerData = socket.id === data.player1.id ? data.player1 : data.player2;
    console.log("Player data:", playerData);
    updateUI(playerChoiceFeedback, "You chose: " + capitalizeFirstLetter(playerData.choice));
    updateUI(opponentChoiceFeedback, "Opponent chose: " + capitalizeFirstLetter(playerData.opponentChoice));
    updateUI(resultFeedback, playerData.result);
    updateScore(playerData.result);
});

    socket.on("roundComplete", (message) => {
        let countdown = 5; // 5 seconds countdown
        countdownHeading.style.display = 'block'; // Show the countdownHeading element
        updateUI(countdownHeading, `New round starts in ${countdown} seconds...`);
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                updateUI(countdownHeading, `New round starts in ${countdown} seconds...`);
            } else {
                clearInterval(countdownInterval);
                updateUI(resultFeedback, message);
                enableButtons();
                countdownHeading.style.display = 'none'; // Hide the countdownHeading element
            }
        }, 1000); // Update every second
    });
});