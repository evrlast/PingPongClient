yourCode = document.getElementById('yourCode')
button = document.getElementById('button')
input = document.getElementById('input')
nickname = document.getElementById('nickname')
welcome = document.getElementById('welcome')
codeTest = document.getElementById('code')
authorization = document.getElementById('authorization')
opponent = document.getElementById('opponent')
opponentLeave = document.getElementById('opponentLeave')

myScore = 0;
opponentScore = 0;

const socket = new WebSocket('ws://192.168.0.93:9595')

canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
connected = false;
nicknameShow = true;
codeShow = false;
yourName = '';
opponentName = '';

ready = false;

const WIDTH = 500;
const HEIGHT = 650;

class Racket {
    constructor(x, y, color) {
        this.width = 130;
        this.height = 15;
        this.speed = 0.25;

        this.color = color;

        this.dx = 0;

        this.x = x;
        this.y = y;

        this.startPos = x;
        this.startTime = Date.now();
    }

    collision() {
        if (this.x < 0) {
            this.x = 0;
            this.startPos = this.x;
            this.startTime = Date.now();
            this.dx = 0;
        }

        if (this.x + this.width > WIDTH) {
            this.x = WIDTH - this.width;
            this.startPos = this.x;
            this.startTime = Date.now();
            this.dx = 0;
        }
    }

    reset() {
        this.x = (WIDTH - this.width) / 2;
        this.startPos = this.x;
        this.startTime = Date.now();
        this.dx = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        this.collision();
        this.x = this.startPos + this.dx * this.speed * (Date.now() - this.startTime);
    }
}

class Ball {
    constructor() {
        this.radius = 7.5;

        this.reset();
    }

    reset() {
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;

        this.speedX = 0;
        this.speedY = 0;

        this.startPosX = this.x;
        this.startPosY = this.y;

        this.startTime = Date.now();
    }

    collision() {
        if (this.x + this.radius > WIDTH) {
            this.speedX = -this.speedX;

            this.x = WIDTH - this.radius;

            this.startPosX = this.x;
            this.startPosY = this.y;
            this.startTime = Date.now();
        }
        if (this.x - this.radius < 0) {
            this.speedX = -this.speedX;

            this.x = this.radius;

            this.startPosX = this.x;
            this.startPosY = this.y;
            this.startTime = Date.now();
        }

        if (this.y + this.radius > HEIGHT - 30) {
            if (this.x >= bottomRacket.x && this.x <= bottomRacket.x + bottomRacket.width) {
                this.speedY = -this.speedY;

                if (Math.abs(this.speedX) < 0.3 && Math.abs(this.speedY) < 0.3) {
                    this.speedY -= 0.01;
                    this.speedX += bottomRacket.dx / 100;
                }

                this.y = HEIGHT - 30 - this.radius;

                this.startPosX = this.x;
                this.startPosY = this.y;
                this.startTime = Date.now();
            } else {
                socket.send(JSON.stringify({goal: '1'}));

                opponentScore++;

                this.reset();
            }
        }
        if (this.y - this.radius < 30) {
            this.speedY = -this.speedY;

            if (Math.abs(this.speedX) < 0.3 && Math.abs(this.speedY) < 0.3) {
                this.speedY += 0.01;
                this.speedX += topRacket.dx / 100;
            }

            this.y = 30 + this.radius;

            this.startPosX = this.x;
            this.startPosY = this.y;
            this.startTime = Date.now();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = "#181";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        this.x = this.startPosX + this.speedX * (Date.now() - this.startTime);
        this.y = this.startPosY + this.speedY * (Date.now() - this.startTime);

        this.collision();
    }
}

topRacket = new Racket(185, 15, "#F00");
bottomRacket = new Racket(185, HEIGHT - 30, "#00F");
ball = new Ball();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "50px serif";

    ctx.beginPath();

    ctx.strokeStyle = '#FFF';

    ctx.moveTo(0, HEIGHT / 2 - 0.5);
    ctx.lineWidth = 2;
    ctx.lineTo(WIDTH, HEIGHT / 2 - 0.5);

    ctx.stroke();

    topRacket.draw();
    ball.draw();
    bottomRacket.draw();

    ctx.fillText(myScore, WIDTH - 60, HEIGHT / 4 * 3 + 20);

    ctx.fillStyle = '#F00';
    ctx.fillText(opponentScore, WIDTH - 60, HEIGHT / 4 + 20);

    raf = window.requestAnimationFrame(draw);
}

raf = window.requestAnimationFrame(draw);

addEventListener('keydown', function (event) {
    if (event.code === 'Enter') {
        submit();
    }
    if (ready) {
        if (event.code === 'ArrowLeft' && bottomRacket.dx !== -1 && bottomRacket.x > 0) {
            bottomRacket.dx = -1;
            bottomRacket.startPos = bottomRacket.x;
            bottomRacket.startTime = Date.now();

            socket.send(JSON.stringify({dx: bottomRacket.dx}));
        }

        if (event.code === 'ArrowRight' && bottomRacket.dx !== 1 && bottomRacket.x + bottomRacket.width < WIDTH) {
            bottomRacket.dx = 1;
            bottomRacket.startPos = bottomRacket.x;
            bottomRacket.startTime = Date.now();

            socket.send(JSON.stringify({dx: bottomRacket.dx}));
        }
    }

});

socket.addEventListener('message', function (event) {
    console.log(Date.now())
    const data = JSON.parse(event.data);
    const {dx, score, speedX, speedY, code, leave, codeError, enemyName} = data;

    if (enemyName) {
        authorization.style.display = 'none';
        opponentName = enemyName;

        opponent.innerText += ' ' + opponentName;

        ready = true;
    }

    if (leave) {
        myScore = 0;
        opponentScore = 0;

        opponent.innerText = 'Your opponent is ';

        ready = false;


        authorization.style.display = 'flex';
        input.style.display = 'block';
        codeTest.style.display = 'block';
        yourCode.style.display = 'block'
        opponentLeave.style.display = 'block';
        codeShow = true;

        topRacket.reset();
        bottomRacket.reset();
        ball.reset();
    }

    if (code) {
        yourCode.innerHTML = 'Your code: ' + code;
    }

    if (codeError) {
        input.classList.add('input-error');
    }

    if (speedX && speedY) {
        topRacket.reset();
        bottomRacket.reset();

        ball.reset();

        ball.speedX = speedX;
        ball.speedY = speedY;
    }

    if (dx) {
        topRacket.dx = -dx;
        topRacket.startTime = Date.now();
        topRacket.startPos = topRacket.x;
    }
    if (score) {
        myScore = score
    }
});

socket.addEventListener('open', function () {
    connected = true;
});

input.addEventListener('input', function () {
    input.value = input.value.toUpperCase();
})

nickname.addEventListener('input', function () {
    if (nickname.classList.contains('input-error')) nickname.classList.remove('input-error')
})

input.addEventListener('input', function () {
    if (input.classList.contains('input-error')) input.classList.remove('input-error')
})

button.addEventListener('click', function () {
    submit();
});

function submit() {
    if (connected) {
        if (nicknameShow) {
            if (nickname.value === '') nickname.classList.add('input-error');
            else {
                socket.send(JSON.stringify({'name': nickname.value}));
                yourName = nickname.value;

                nickname.style.display = 'none';
                welcome.style.display = 'none';
                nicknameShow = false;

                input.style.display = 'block';
                codeTest.style.display = 'block';
                yourCode.style.display = 'block'
                codeShow = true;
            }
        } else {
            if (codeShow) {
                if (input.value === '') input.classList.add('input-error');
                else {
                    socket.send(JSON.stringify({'code': input.value}));
                }
            }
        }

    }
}
