document.addEventListener("DOMContentLoaded", () => {
    setButtonState(false);

    // UI setup
    const usernameInput = document.getElementById("username");
    const submitUsernameButton = document.getElementById("submit-username");

    const countdownHeading = document.querySelector(".countdown")
    
    const gameStatusFeedback = document.querySelector(".game-status");
    const playerChoiceFeedback = document.querySelector(".player-choice");
    const opponentChoiceFeedback = document.querySelector(".opponent-choice");
    const resultFeedback = document.querySelector(".result");
    
    const opponentUsernameElement = document.querySelector(".opponent-username");
    
    const playerScoreElement = document.querySelector(".player-score");
    const opponentScoreElement = document.querySelector(".opponent-score");
    let playerScore = 0;
    let opponentScore = 0;

    let currentCountdownInterval = null;

    // Functions
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function setButtonState(enabled) { // true = enabled, false = disabled
        document.querySelectorAll('.buttons button').forEach(button => {
            button.disabled = !enabled;
        });
    }

    function updateUI(element, message) {
        element.textContent = message;
    }

    function clearUI() {
        countdownHeading.textContent = "";
        playerChoiceFeedback.textContent = "";
        opponentChoiceFeedback.textContent = "";
        resultFeedback.textContent = "";
        opponentUsernameElement.textContent = "";
    }

    function playGame(choice) {
        playerChoice = choice;
        setButtonState(false);
        socket.emit("playerChoice", choice); // Send choice to server
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

    // socket.io
    // const socket = io("https://rock-paper-scissors-online-9928.onrender.com"); // Connect to WebSocket server
    const socket = io(); // Run server using localhost
    let playerChoice = null;
    
    socket.on("waiting", (message) => {
        updateUI(gameStatusFeedback, message);
    });
    
    socket.on("startGame", (message) => {
        updateUI(gameStatusFeedback, message);
        setButtonState(true);
    });
    
    socket.on("waitingForChoice", (message) => {
        updateUI(gameStatusFeedback, message);
    });

    socket.on("opponentDisconnected", (message) => {
        if (currentCountdownInterval) {
            clearInterval(currentCountdownInterval);
            currentCountdownInterval = null;
        }

        updateUI(gameStatusFeedback, message);
        setButtonState(false);
        clearUI();
    });

    socket.on("opponentUsername", (username) => {
        updateUI(opponentUsernameElement, `You're playing against: ${username}`);
    });

    // Receive game result from server
    socket.on("gameResult", (data) => {
        console.log("Received gameResult event:", data);
        const playerData = socket.id === data.player1.id ? data.player1 : data.player2;
        console.log("Player data:", playerData);
        updateUI(playerChoiceFeedback, "You chose: " + capitalizeFirstLetter(playerData.choice));
        updateUI(opponentChoiceFeedback, "Opponent chose: " + capitalizeFirstLetter(playerData.opponentChoice));

        switch (playerData.result) {
            case "You won!":
                resultFeedback.classList.add("winner");
                resultFeedback.classList.remove("draw", "loser");
                break;

            case "You lost!":
                resultFeedback.classList.add("loser");
                resultFeedback.classList.remove("draw", "winner");
                break;

            case "Draw!":
                resultFeedback.classList.add("draw");
                resultFeedback.classList.remove("winner", "loser");
                break;
        }
    
        updateUI(resultFeedback, playerData.result);
        updateScore(playerData.result);
    });

    socket.on("roundComplete", (message) => {
        let countdown = 5; // 5 seconds countdown
        countdownHeading.style.display = 'block'; // Show the countdownHeading element
        updateUI(countdownHeading, `New round starts in ${countdown} seconds...`);
        updateUI(gameStatusFeedback, "");

        if (currentCountdownInterval) {
            clearInterval(currentCountdownInterval);
        }
        
        currentCountdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                updateUI(countdownHeading, `New round starts in ${countdown} seconds...`);
            } else {
                clearInterval(currentCountdownInterval);
                currentCountdownInterval = null;
                updateUI(countdownHeading, message);
                setButtonState(true);
            }
        }, 1000); // Update every second
    });

    // Event listeners
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

    //Prevent username form from submitting and reloading the page
    document.getElementById("username-form").addEventListener("submit", function(event) {
        event.preventDefault(); 
      });
    
    submitUsernameButton.addEventListener("click", () => {
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit("setUsername", username);
            submitUsernameButton.disabled = true;
            usernameInput.disabled = true;
            submitUsernameButton.style.display = 'none';
        }
    });
});