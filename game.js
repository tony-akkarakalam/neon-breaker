const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const backgroundCanvas = document.getElementById("backgroundCanvas");
const bgCtx = backgroundCanvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const countdownScreen = document.getElementById("countdownScreen");
const countdownNumber = document.getElementById("countdownNumber");
const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const difficultyEl = document.getElementById("difficulty");

const completedLevelEl = document.getElementById("completedLevel");
const finalScoreEl = document.getElementById("finalScore");
const finalBestEl = document.getElementById("finalBest");

/* =========================================================
CANVAS
========================================================= */

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

backgroundCanvas.width = width;
backgroundCanvas.height = height;

/* =========================================================
GAME STATE
========================================================= */

let gameRunning = false;
let gameStarted = false;
let countdownActive = false;

let score = 0;
let best = Number(localStorage.getItem("neonBreakerBest")) || 0;

let level = 1;
let lives = 3;

let difficulty = null;

let countdownTimer = null;

bestEl.textContent = formatNumber(best);

/* =========================================================
DIFFICULTY
========================================================= */

const difficultyMap = {
"1": {
name: "EASY",
ballSpeed: 5,
paddleSpeed: 9
},


"2": {
    name: "MEDIUM",
    ballSpeed: 6,
    paddleSpeed: 8
},

"3": {
    name: "HARD",
    ballSpeed: 7,
    paddleSpeed: 7
},

"4": {
    name: "INSANE",
    ballSpeed: 8,
    paddleSpeed: 6
}


};

/* =========================================================
INPUT
========================================================= */

const keys = {
left: false,
right: false
};

/* =========================================================
PADDLE
========================================================= */

const paddle = {
width: 150,
height: 14,
x: width / 2 - 75,
y: height - 80,


speed: 8


};

/* =========================================================
BALL
========================================================= */

const ball = {
x: width / 2,
y: height - 110,


radius: 8,

dx: 0,
dy: 0,

speed: 6,

launched: false


};

/* =========================================================
BRICKS
========================================================= */

let bricks = [];

const brickSettings = {
rows: 6,
columns: 11,


width: 80,
height: 24,

gap: 9,

top: 120


};

/* =========================================================
PARTICLES
========================================================= */

let particles = [];

/* =========================================================
SCREEN SHAKE
========================================================= */

let shake = 0;

/* =========================================================
RESIZE
========================================================= */

function resize() {


width = window.innerWidth;
height = window.innerHeight;

canvas.width = width;
canvas.height = height;

backgroundCanvas.width = width;
backgroundCanvas.height = height;

paddle.y = height - 80;

if (difficulty && gameStarted) {
    createBricks();
}


}

window.addEventListener("resize", resize);

/* =========================================================
UTILITIES
========================================================= */

function formatNumber(number) {
return String(Math.floor(number)).padStart(6, "0");
}

function clamp(value, min, max) {
return Math.max(min, Math.min(max, value));
}

/* =========================================================
DIFFICULTY SELECTION
========================================================= */

function selectDifficulty(key) {


if (!difficultyMap[key]) {
    return;
}

difficulty = difficultyMap[key];

difficultyEl.textContent = difficulty.name;

gameStarted = true;

startScreen.classList.add("hidden");

beginCountdown();


}

/* =========================================================
COUNTDOWN
========================================================= */

function beginCountdown() {


if (countdownActive) {
    return;
}

if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
}

gameRunning = false;
countdownActive = true;

countdownScreen.classList.remove("hidden");

let count = 3;

showCountdownNumber(count);

function nextCount() {

    if (!countdownActive) {
        return;
    }

    count--;

    if (count > 0) {

        showCountdownNumber(count);

        countdownTimer = setTimeout(nextCount, 1000);

    } else {

        showCountdownNumber("GO");

        countdownTimer = setTimeout(() => {

            countdownTimer = null;

            countdownActive = false;

            countdownScreen.classList.add("hidden");

            startGame();

        }, 700);
    }
}

countdownTimer = setTimeout(nextCount, 1000);


}

/* =========================================================
COUNTDOWN DISPLAY
========================================================= */

function showCountdownNumber(value) {


countdownNumber.textContent = value;

countdownNumber.style.animation = "none";

void countdownNumber.offsetWidth;

countdownNumber.style.animation = "countdownPulse 0.9s ease-in-out";


}

/* =========================================================
START GAME
========================================================= */

function startGame() {


if (!difficulty) {
    return;
}

score = 0;
level = 1;
lives = 3;

gameRunning = true;

paddle.speed = difficulty.paddleSpeed;

scoreEl.textContent = formatNumber(score);
levelEl.textContent = String(level).padStart(2, "0");
livesEl.textContent = String(lives).padStart(2, "0");

createBricks();

resetBall();

particles = [];

levelCompleteScreen.classList.add("hidden");
gameOverScreen.classList.add("hidden");

gameLoop();


}

/* =========================================================
CREATE BRICKS
========================================================= */

function createBricks() {


bricks = [];

const columns = brickSettings.columns;
const rows = brickSettings.rows;

const totalWidth =
    columns * brickSettings.width +
    (columns - 1) * brickSettings.gap;

let startX = (width - totalWidth) / 2;

if (startX < 20) {
    startX = 20;
}

for (let row = 0; row < rows; row++) {

    for (let column = 0; column < columns; column++) {

        const x =
            startX +
            column * (brickSettings.width + brickSettings.gap);

        const y =
            brickSettings.top +
            row * (brickSettings.height + brickSettings.gap);

        bricks.push({
            x: x,
            y: y,

            width: brickSettings.width,
            height: brickSettings.height,

            alive: true,

            row: row
        });
    }
}


}

/* =========================================================
RESET BALL
========================================================= */

function resetBall() {


ball.x = width / 2;

ball.y = paddle.y - 20;

ball.speed = difficulty.ballSpeed;

ball.dx = 0;

ball.dy = 0;

ball.launched = false;


}

/* =========================================================
LAUNCH BALL
========================================================= */

function launchBall() {


if (!gameRunning) {
    return;
}

if (ball.launched) {
    return;
}

ball.launched = true;

const angle = (Math.random() * 0.8 - 0.4);

ball.dx = ball.speed * angle;

ball.dy = -Math.sqrt(
    ball.speed * ball.speed -
    ball.dx * ball.dx
);


}

/* =========================================================
PADDLE UPDATE
========================================================= */

function updatePaddle() {


if (keys.left) {
    paddle.x -= paddle.speed;
}

if (keys.right) {
    paddle.x += paddle.speed;
}

paddle.x = clamp(
    paddle.x,
    10,
    width - paddle.width - 10
);


}

/* =========================================================
BALL UPDATE
========================================================= */

function updateBall() {


if (!ball.launched) {

    ball.x = paddle.x + paddle.width / 2;

    ball.y = paddle.y - ball.radius - 4;

    return;
}

ball.x += ball.dx;
ball.y += ball.dy;


/* Wall collision */

if (ball.x - ball.radius <= 0) {

    ball.x = ball.radius;

    ball.dx = Math.abs(ball.dx);

    createParticles(
        ball.x,
        ball.y,
        "#00f5ff",
        5
    );
}


if (ball.x + ball.radius >= width) {

    ball.x = width - ball.radius;

    ball.dx = -Math.abs(ball.dx);

    createParticles(
        ball.x,
        ball.y,
        "#00f5ff",
        5
    );
}


if (ball.y - ball.radius <= 0) {

    ball.y = ball.radius;

    ball.dy = Math.abs(ball.dy);

    createParticles(
        ball.x,
        ball.y,
        "#8b5cf6",
        5
    );
}


/* Paddle collision */

if (
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
) {

    ball.y = paddle.y - ball.radius;

    const hitPosition =
        (ball.x - paddle.x) / paddle.width;

    const angle =
        (hitPosition - 0.5) * Math.PI * 0.75;

    ball.dx = ball.speed * Math.sin(angle);

    ball.dy = -Math.abs(
        ball.speed * Math.cos(angle)
    );

    createParticles(
        ball.x,
        ball.y,
        "#00f5ff",
        12
    );
}


/* Brick collision */

for (let i = 0; i < bricks.length; i++) {

    const brick = bricks[i];

    if (!brick.alive) {
        continue;
    }

    if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height
    ) {

        brick.alive = false;

        score += 100;

        updateScore();

        ball.dy *= -1;

        createParticles(
            ball.x,
            ball.y,
            getBrickColor(brick.row),
            18
        );

        shake = 5;

        break;
    }
}


/* Ball lost */

if (ball.y - ball.radius > height) {

    loseLife();
}


}

/* =========================================================
LOSE LIFE
========================================================= */

function loseLife() {


if (!gameRunning) {
    return;
}

lives--;

livesEl.textContent =
    String(lives).padStart(2, "0");

createParticles(
    ball.x,
    height - 20,
    "#ff4fd8",
    25
);

shake = 12;

if (lives <= 0) {

    endGame();

    return;
}

resetBall();


}

/* =========================================================
CHECK LEVEL
========================================================= */

function checkLevelComplete() {


if (bricks.length === 0) {
    return;
}

const remaining = bricks.some(
    brick => brick.alive
);

if (!remaining) {

    gameRunning = false;

    completedLevelEl.textContent =
        String(level).padStart(2, "0");

    levelCompleteScreen.classList.remove("hidden");
}


}

/* =========================================================
NEXT LEVEL
========================================================= */

function nextLevel() {


level++;

levelEl.textContent =
    String(level).padStart(2, "0");

createBricks();

resetBall();

levelCompleteScreen.classList.add("hidden");

gameRunning = true;


}

/* =========================================================
SCORE
========================================================= */

function updateScore() {


scoreEl.textContent =
    formatNumber(score);

if (score > best) {

    best = score;

    bestEl.textContent =
        formatNumber(best);

    localStorage.setItem(
        "neonBreakerBest",
        best
    );
}


}

/* =========================================================
END GAME
========================================================= */

function endGame() {


gameRunning = false;

finalScoreEl.textContent =
    formatNumber(score);

finalBestEl.textContent =
    formatNumber(best);

gameOverScreen.classList.remove("hidden");


}

/* =========================================================
RETURN TO MENU
========================================================= */

function returnToMenu() {


if (countdownTimer) {

    clearTimeout(countdownTimer);

    countdownTimer = null;
}

countdownActive = false;

gameRunning = false;

gameStarted = false;

difficulty = null;

countdownScreen.classList.add("hidden");

levelCompleteScreen.classList.add("hidden");

gameOverScreen.classList.add("hidden");

startScreen.classList.remove("hidden");

difficultyEl.textContent = "—";


}

/* =========================================================
BRICK COLORS
========================================================= */

function getBrickColor(row) {


const colors = [
    "#ff4fd8",
    "#8b5cf6",
    "#387cff",
    "#00f5ff",
    "#00d9ff",
    "#5ffcff"
];

return colors[row % colors.length];


}

/* =========================================================
PARTICLES
========================================================= */

function createParticles(x, y, color, amount) {


for (let i = 0; i < amount; i++) {

    const angle =
        Math.random() * Math.PI * 2;

    const speed =
        Math.random() * 4 + 1;

    particles.push({
        x: x,
        y: y,

        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,

        size: Math.random() * 3 + 1,

        life: 1,

        color: color
    });
}


}

function updateParticles() {


for (let i = particles.length - 1; i >= 0; i--) {

    const particle = particles[i];

    particle.x += particle.dx;

    particle.y += particle.dy;

    particle.dy += 0.04;

    particle.life -= 0.025;

    if (particle.life <= 0) {
        particles.splice(i, 1);
    }
}


}

/* =========================================================
DRAW BACKGROUND
========================================================= */

function drawBackground() {


bgCtx.clearRect(
    0,
    0,
    width,
    height
);

const gradient =
    bgCtx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
    );

gradient.addColorStop(
    0,
    "#07172b"
);

gradient.addColorStop(
    0.5,
    "#030a17"
);

gradient.addColorStop(
    1,
    "#01030a"
);

bgCtx.fillStyle = gradient;

bgCtx.fillRect(
    0,
    0,
    width,
    height
);


/* Grid */

bgCtx.strokeStyle =
    "rgba(0,245,255,0.035)";

bgCtx.lineWidth = 1;

const gridSize = 45;

for (
    let x = 0;
    x < width;
    x += gridSize
) {

    bgCtx.beginPath();

    bgCtx.moveTo(x, 0);

    bgCtx.lineTo(x, height);

    bgCtx.stroke();
}

for (
    let y = 0;
    y < height;
    y += gridSize
) {

    bgCtx.beginPath();

    bgCtx.moveTo(0, y);

    bgCtx.lineTo(width, y);

    bgCtx.stroke();
}


}

/* =========================================================
DRAW BRICKS
========================================================= */

function drawBricks() {


for (const brick of bricks) {

    if (!brick.alive) {
        continue;
    }

    const color =
        getBrickColor(brick.row);

    ctx.save();

    ctx.shadowColor = color;

    ctx.shadowBlur = 16;

    ctx.fillStyle = color;

    ctx.globalAlpha = 0.85;

    ctx.beginPath();

    ctx.roundRect(
        brick.x,
        brick.y,
        brick.width,
        brick.height,
        5
    );

    ctx.fill();

    ctx.globalAlpha = 0.22;

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        brick.x + 4,
        brick.y + 3,
        brick.width - 8,
        2
    );

    ctx.restore();
}


}

/* =========================================================
DRAW PADDLE
========================================================= */

function drawPaddle() {


const gradient =
    ctx.createLinearGradient(
        paddle.x,
        paddle.y,
        paddle.x + paddle.width,
        paddle.y
    );

gradient.addColorStop(
    0,
    "#387cff"
);

gradient.addColorStop(
    0.5,
    "#00f5ff"
);

gradient.addColorStop(
    1,
    "#8b5cf6"
);

ctx.save();

ctx.shadowColor = "#00f5ff";

ctx.shadowBlur = 25;

ctx.fillStyle = gradient;

ctx.beginPath();

ctx.roundRect(
    paddle.x,
    paddle.y,
    paddle.width,
    paddle.height,
    8
);

ctx.fill();

ctx.restore();


}

/* =========================================================
DRAW BALL
========================================================= */

function drawBall() {


ctx.save();

ctx.shadowColor = "#00f5ff";

ctx.shadowBlur = 28;

const gradient =
    ctx.createRadialGradient(
        ball.x - 3,
        ball.y - 3,
        1,
        ball.x,
        ball.y,
        ball.radius
    );

gradient.addColorStop(
    0,
    "#ffffff"
);

gradient.addColorStop(
    0.35,
    "#5ffcff"
);

gradient.addColorStop(
    1,
    "#00a8ff"
);

ctx.fillStyle = gradient;

ctx.beginPath();

ctx.arc(
    ball.x,
    ball.y,
    ball.radius,
    0,
    Math.PI * 2
);

ctx.fill();

ctx.restore();


}

/* =========================================================
DRAW PARTICLES
========================================================= */

function drawParticles() {


for (const particle of particles) {

    ctx.save();

    ctx.globalAlpha = particle.life;

    ctx.fillStyle = particle.color;

    ctx.shadowColor = particle.color;

    ctx.shadowBlur = 10;

    ctx.beginPath();

    ctx.arc(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


}

/* =========================================================
DRAW
========================================================= */

function draw() {


ctx.clearRect(
    0,
    0,
    width,
    height
);

drawBricks();

drawPaddle();

drawBall();

drawParticles();


}

/* =========================================================
GAME LOOP
========================================================= */

function gameLoop() {


if (!gameRunning) {
    return;
}

updatePaddle();

updateBall();

updateParticles();

checkLevelComplete();

draw();

if (shake > 0) {
    shake *= 0.85;

    if (shake < 0.2) {
        shake = 0;
    }
}

requestAnimationFrame(gameLoop);


}

/* =========================================================
KEYBOARD
========================================================= */

document.addEventListener("keydown", function(event) {


const key = event.key.toLowerCase();

if (
    key === "arrowleft" ||
    key === "arrowright" ||
    key === "arrowup" ||
    key === "arrowdown" ||
    key === " "
) {
    event.preventDefault();
}


/* Difficulty selection */

if (!gameStarted) {

    if (
        event.key === "1" ||
        event.key === "2" ||
        event.key === "3" ||
        event.key === "4"
    ) {

        selectDifficulty(event.key);
    }

    return;
}


/* Ignore keyboard while countdown is active */

if (countdownActive) {
    return;
}


/* Game not running */

if (!gameRunning) {

    if (key === " ") {

        if (
            !gameOverScreen.classList.contains("hidden")
        ) {

            gameOverScreen.classList.add("hidden");

            beginCountdown();

            return;
        }

        if (
            !levelCompleteScreen.classList.contains("hidden")
        ) {

            nextLevel();

            return;
        }

        beginCountdown();

        return;
    }


    if (key === "escape") {

        returnToMenu();

        return;
    }

    return;
}


/* Movement */

if (
    key === "a" ||
    key === "arrowleft"
) {

    keys.left = true;
}


if (
    key === "d" ||
    key === "arrowright"
) {

    keys.right = true;
}


/* Launch */

if (key === " ") {

    launchBall();
}


});

document.addEventListener("keyup", function(event) {


const key = event.key.toLowerCase();

if (
    key === "a" ||
    key === "arrowleft"
) {

    keys.left = false;
}


if (
    key === "d" ||
    key === "arrowright"
) {

    keys.right = false;
}


});

/* =========================================================
DIFFICULTY BUTTONS
========================================================= */

document
.querySelectorAll(".difficulty-item")
.forEach(button => {


    button.addEventListener("click", function() {

        const difficultyKey =
            this.dataset.difficulty;

        selectDifficulty(difficultyKey);
    });

});


/* =========================================================
INITIAL DRAW
========================================================= */

drawBackground();

draw();
