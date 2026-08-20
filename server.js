const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Backup Trivia Database (Used ONLY if the API fails)
const triviaDB = {
    Sports: [
        { q: "Who is the only athlete to play in both a Super Bowl and a World Series?", a: "Deion Sanders", options: ["Deion Sanders", "Bo Jackson", "Michael Jordan", "Jim Brown"] },
        { q: "In tennis, what term is used for a score of zero?", a: "Love", options: ["Love", "Fault", "Deuce", "Nil"] },
        { q: "Which country has won the most FIFA World Cups?", a: "Brazil", options: ["Brazil", "Germany", "Italy", "Argentina"] },
        { q: "What is the distance of a marathon in miles?", a: "26.2", options: ["26.2", "24.5", "28.1", "20.0"] },
        { q: "Who holds the record for the most Olympic gold medals?", a: "Michael Phelps", options: ["Michael Phelps", "Usain Bolt", "Carl Lewis", "Mark Spitz"] }
    ],
    Animals: [
        { q: "What is the fastest land animal?", a: "Cheetah", options: ["Cheetah", "Lion", "Horse", "Ostrich"] },
        { q: "What is the largest mammal in the world?", a: "Blue Whale", options: ["Blue Whale", "Elephant", "Giraffe", "Orca"] },
        { q: "A group of crows is called what?", a: "A Murder", options: ["A Murder", "A Flock", "A Pack", "A Gaggle"] },
        { q: "How many legs does a spider have?", a: "8", options: ["8", "6", "10", "12"] },
        { q: "What is the only mammal capable of true sustained flight?", a: "Bat", options: ["Bat", "Flying Squirrel", "Lemur", "Sugar Glider"] }
    ],
    Car: [
        { q: "What was the first mass-produced car?", a: "Ford Model T", options: ["Ford Model T", "Volkswagen Beetle", "Chevrolet Bel Air", "Honda Civic"] },
        { q: "Which car manufacturer produces the 911 model?", a: "Porsche", options: ["Porsche", "BMW", "Audi", "Mercedes-Benz"] },
        { q: "What does 'BMW' stand for in English?", a: "Bavarian Motor Works", options: ["Bavarian Motor Works", "British Motor Works", "Berlin Motor Works", "Belgian Motor Works"] },
        { q: "The 'Prancing Horse' is the logo of which car brand?", a: "Ferrari", options: ["Ferrari", "Lamborghini", "Mustang", "Porsche"] },
        { q: "What country produces the Subaru?", a: "Japan", options: ["Japan", "South Korea", "Germany", "USA"] }
    ],
    Movie: [
        { q: "Who directed the movie 'Pulp Fiction'?", a: "Quentin Tarantino", options: ["Quentin Tarantino", "Martin Scorsese", "Steven Spielberg", "Christopher Nolan"] },
        { q: "What is the highest-grossing film of all time?", a: "Avatar", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"] },
        { q: "Which actor played the character of Neo in 'The Matrix'?", a: "Keanu Reeves", options: ["Keanu Reeves", "Tom Cruise", "Brad Pitt", "Will Smith"] },
        { q: "What 1994 film won Best Picture and starred Tom Hanks?", a: "Forrest Gump", options: ["Forrest Gump", "Shawshank Redemption", "Pulp Fiction", "Cast Away"] },
        { q: "In 'The Godfather', what is the name of the family patriarch?", a: "Vito Corleone", options: ["Vito Corleone", "Michael Corleone", "Sonny Corleone", "Fredo Corleone"] }
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

// Helper function to clean weird API formatting
function decodeHTML(text) {
    return text.replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&eacute;/g, 'é');
}

function nextQuestion() {
    if (currentQIndex >= 10) {
        io.emit('gameOver', getLeaderboard());
        gameActive = false;
        return;
    }

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
        setTimeout(nextQuestion, 4000); 
    }, TIME_LIMIT);
}

io.on('connection', (socket) => {
    if (Object.keys(players).length >= 25) {
        socket.emit('errorMsg', 'Lobby is full (Max 25 players).');
        return;
    }

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

    socket.on('startGame', async (category) => {
        if (gameActive) return;
        gameActive = true;
        
        io.emit('gameStarted'); 

        let questions = [];

        try {
            // Map ALL categories to OpenTDB API ID numbers
            const categoryIds = { 'Sports': 21, 'Car': 28, 'Movie': 11, 'Animals': 27 };
            const apiId = categoryIds[category];
            
            // Fetch 10 random, medium difficulty, multiple choice questions
            const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${apiId}&difficulty=medium&type=multiple`);
            const apiData = await response.json();

            if (apiData.results && apiData.results.length > 0) {
                questions = apiData.results.map(q => {
                    let decodedQ = decodeHTML(q.question);
                    let decodedA = decodeHTML(q.correct_answer);
                    let options = q.incorrect_answers.map(opt => decodeHTML(opt));
                    options.push(decodedA);

                    return { q: decodedQ, a: decodedA, options: options };
                });
            } else {
                throw new Error("API returned empty data.");
            }
        } catch (error) {
            console.log("API Error - Falling back to local backup questions.", error);
            questions = shuffleArray([...triviaDB[category]]).slice(0, 10); // Uses local backup if API fails
        }

        currentQIndex = 0;
        currentQuestions = questions;
        
        for (let id in players) players[id].score = 0;
        
        io.emit('startCountdown');
        
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
            let timeScore = Math.max(10, 1000 - Math.floor(timeTaken / 10)); 
            player.score += timeScore;
        }
    });

    socket.on('resetServer', () => {
        gameActive = false;
        clearTimeout(answerTimer);
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
