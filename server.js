const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Trivia Database (Moderately Hard)
const triviaDB = {
    Sports: [
        { q: "Who is the only athlete to play in both a Super Bowl and a World Series?", a: "Deion Sanders", options: ["Deion Sanders", "Bo Jackson", "Michael Jordan", "Jim Brown"] },
        { q: "In tennis, what term is used for a score of zero?", a: "Love", options: ["Love", "Fault", "Deuce", "Nil"] },
        { q: "Which country has won the most FIFA World Cups?", a: "Brazil", options: ["Brazil", "Germany", "Italy", "Argentina"] },
        { q: "What is the distance of a marathon in miles?", a: "26.2", options: ["26.2", "24.5", "28.1", "20.0"] },
        { q: "Who holds the record for the most Olympic gold medals?", a: "Michael Phelps", options: ["Michael Phelps", "Usain Bolt", "Carl Lewis", "Mark Spitz"] },
        { q: "In what sport would you perform a 'Fosbury Flop'?", a: "High Jump", options: ["High Jump", "Diving", "Gymnastics", "Pole Vault"] },
        { q: "Which NHL team has won the most Stanley Cups?", a: "Montreal Canadiens", options: ["Montreal Canadiens", "Toronto Maple Leafs", "Detroit Red Wings", "Boston Bruins"] },
        { q: "What basketball player scored 100 points in a single game?", a: "Wilt Chamberlain", options: ["Wilt Chamberlain", "Michael Jordan", "Kobe Bryant", "LeBron James"] },
        { q: "The Ryder Cup is contested in which sport?", a: "Golf", options: ["Golf", "Tennis", "Polo", "Cricket"] },
        { q: "Who was the first boxer to defeat Muhammad Ali?", a: "Joe Frazier", options: ["Joe Frazier", "George Foreman", "Sonny Liston", "Ken Norton"] }
    ],
    Food: [
        { q: "What is the main ingredient in hummus?", a: "Chickpeas", options: ["Chickpeas", "Lentils", "Black Beans", "Edamame"] },
        { q: "Saffron comes from which type of flower?", a: "Crocus", options: ["Crocus", "Rose", "Orchid", "Tulip"] },
        { q: "Which country is the origin of the cocktail Mojito?", a: "Cuba", options: ["Cuba", "Mexico", "Puerto Rico", "Spain"] },
        { q: "What type of pasta has a name meaning 'little worms'?", a: "Vermicelli", options: ["Vermicelli", "Linguine", "Orzo", "Farfalle"] },
        { q: "Escargot is a dish made from what animal?", a: "Snail", options: ["Snail", "Octopus", "Frog", "Clam"] },
        { q: "What is the primary ingredient in guacamole?", a: "Avocado", options: ["Avocado", "Tomato", "Lime", "Jalapeno"] },
        { q: "What cheese is traditionally used on a Margherita pizza?", a: "Mozzarella", options: ["Mozzarella", "Provolone", "Parmesan", "Ricotta"] },
        { q: "A traditional Japanese miso soup is made using a paste of fermented what?", a: "Soybeans", options: ["Soybeans", "Rice", "Seaweed", "Fish"] },
        { q: "Which nut is used to make marzipan?", a: "Almond", options: ["Almond", "Walnut", "Pecan", "Cashew"] },
        { q: "What is the most expensive spice in the world by weight?", a: "Saffron", options: ["Saffron", "Vanilla", "Cardamom", "Cinnamon"] }
    ],
    Car: [
        { q: "What was the first mass-produced car?", a: "Ford Model T", options: ["Ford Model T", "Volkswagen Beetle", "Chevrolet Bel Air", "Honda Civic"] },
        { q: "Which car manufacturer produces the 911 model?", a: "Porsche", options: ["Porsche", "BMW", "Audi", "Mercedes-Benz"] },
        { q: "What does 'BMW' stand for in English?", a: "Bavarian Motor Works", options: ["Bavarian Motor Works", "British Motor Works", "Berlin Motor Works", "Belgian Motor Works"] },
        { q: "The 'Prancing Horse' is the logo of which car brand?", a: "Ferrari", options: ["Ferrari", "Lamborghini", "Mustang", "Porsche"] },
        { q: "What country produces the Subaru?", a: "Japan", options: ["Japan", "South Korea", "Germany", "USA"] },
        { q: "Which company owns Bugatti, Lamborghini, and Bentley?", a: "Volkswagen Group", options: ["Volkswagen Group", "Stellantis", "Toyota", "BMW Group"] },
        { q: "What was the first car launched into space?", a: "Tesla Roadster", options: ["Tesla Roadster", "Apollo Rover", "Ford Mustang", "DeLorean"] },
        { q: "In what year was the Chevrolet Corvette first introduced?", a: "1953", options: ["1953", "1964", "1949", "1957"] },
        { q: "The Spirit of Ecstasy is the hood ornament on which car?", a: "Rolls-Royce", options: ["Rolls-Royce", "Bentley", "Jaguar", "Aston Martin"] },
        { q: "What is the best-selling electric vehicle of all time as of 2024?", a: "Tesla Model Y", options: ["Tesla Model Y", "Nissan Leaf", "Tesla Model 3", "Chevy Bolt"] }
    ],
    Movie: [
        { q: "Who directed the movie 'Pulp Fiction'?", a: "Quentin Tarantino", options: ["Quentin Tarantino", "Martin Scorsese", "Steven Spielberg", "Christopher Nolan"] },
        { q: "What is the highest-grossing film of all time?", a: "Avatar", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"] },
        { q: "Which actor played the character of Neo in 'The Matrix'?", a: "Keanu Reeves", options: ["Keanu Reeves", "Tom Cruise", "Brad Pitt", "Will Smith"] },
        { q: "What 1994 film won Best Picture and starred Tom Hanks?", a: "Forrest Gump", options: ["Forrest Gump", "Shawshank Redemption", "Pulp Fiction", "Cast Away"] },
        { q: "In 'The Godfather', what is the name of the family patriarch?", a: "Vito Corleone", options: ["Vito Corleone", "Michael Corleone", "Sonny Corleone", "Fredo Corleone"] },
        { q: "What was the first feature-length animated movie ever released?", a: "Snow White", options: ["Snow White", "Cinderella", "Fantasia", "Bambi"] },
        { q: "For which movie did Leonardo DiCaprio win his first Oscar?", a: "The Revenant", options: ["The Revenant", "Titanic", "The Wolf of Wall Street", "Inception"] },
        { q: "What is the name of the fictional African country in 'Black Panther'?", a: "Wakanda", options: ["Wakanda", "Zamunda", "Genosha", "Latveria"] },
        { q: "Which horror movie features a serial killer named Michael Myers?", a: "Halloween", options: ["Halloween", "Friday the 13th", "A Nightmare on Elm Street", "Scream"] },
        { q: "What item is Indiana Jones searching for in 'Raiders of the Lost Ark'?", a: "The Ark of the Covenant", options: ["The Ark of the Covenant", "The Holy Grail", "Sankara Stones", "The Crystal Skull"] }
    ]
};

// Game State
let players = {};
let gameActive = false;
let currentQuestions = [];
let currentQIndex = 0;
let questionStartTime = 0;
let answerTimer = null;
const TIME_LIMIT = 10000; // 10 seconds per question

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function getLeaderboard() {
    return Object.values(players).sort((a, b) => b.score - a.score);
}

function nextQuestion() {
    if (currentQIndex >= 10) {
        io.emit('gameOver', getLeaderboard());
        gameActive = false;
        return;
    }

    // Reset player answer states
    for (let id in players) players[id].answered = false;

    let qData = currentQuestions[currentQIndex];
    let shuffledOptions = shuffleArray([...qData.options]);
    
    questionStartTime = Date.now();
    io.emit('newQuestion', {
        question: qData.q,
        options: shuffledOptions,
        questionNumber: currentQIndex + 1
    });

    answerTimer = setTimeout(() => {
        io.emit('showAnswer', { correctAnswer: qData.a, leaderboard: getLeaderboard() });
        currentQIndex++;
        setTimeout(nextQuestion, 4000); // Wait 4 seconds before next question
    }, TIME_LIMIT);
}

io.on('connection', (socket) => {
    if (Object.keys(players).length >= 25) {
        socket.emit('errorMsg', 'Lobby is full (Max 25 players).');
        return;
    }

    // Now accepts an object with both name and emoji
    socket.on('joinGame', (playerData) => {
        if (gameActive) return socket.emit('errorMsg', 'Game in progress.');
        players[socket.id] = { 
            name: playerData.name || 'Player', 
            emoji: playerData.emoji || '😎', 
            score: 0, 
            answered: false 
        };
        io.emit('updateLobby', getLeaderboard(), gameActive);
    });

    socket.on('startGame', (category) => {
        if (gameActive || !triviaDB[category]) return;
        gameActive = true;
        currentQIndex = 0;
        currentQuestions = shuffleArray([...triviaDB[category]]).slice(0, 10);
        
        // Reset scores
        for (let id in players) players[id].score = 0;
        
        io.emit('gameStarted');
        io.emit('startCountdown');
        
        // Wait 3 seconds for the countdown before showing the first question
        setTimeout(() => {
            nextQuestion();
        }, 3000);
    });

    socket.on('submitAnswer', (answer) => {
        let player = players[socket.id];
        if (!player || player.answered || !gameActive) return;
        
        player.answered = true;
        let correctAnswer = currentQuestions[currentQIndex].a;
        
        if (answer === correctAnswer) {
            let timeTaken = Date.now() - questionStartTime;
            let timeScore = Math.max(10, 1000 - Math.floor(timeTaken / 10)); // Quicker = more points
            player.score += timeScore;
        }
    });

    socket.on('resetServer', () => {
        gameActive = false;
        clearTimeout(answerTimer);
        // Reset player scores but keep them in the lobby
        for (let id in players) {
            players[id].score = 0;
            players[id].answered = false;
        }
        io.emit('forceLobby');
        io.emit('updateLobby', getLeaderboard(), gameActive);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updateLobby', getLeaderboard(), gameActive);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Trivia Server running on port ${PORT}`));
