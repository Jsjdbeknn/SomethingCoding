const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State & Settings
let gameState = 'START';
let score = 0;
const WIN_SCORE = 15;
let player;
let hearts = [];
let particles = [];
let stars = [];
let screenShake = 0;

// DOM Elements
const loveMeter = document.getElementById('love-fill');
const startScreen = document.getElementById('start-screen');
const proposalScreen = document.getElementById('proposal-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const startBtn = document.getElementById('start-btn');

// --- Initialization ---

function initBackground() {
    stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.3
    }));
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) player.y = canvas.height - 100;
}

// --- Logic Classes ---

class Player {
    constructor() {
        this.w = 120;
        this.h = 40;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.targetX = canvas.width / 2;
        this.squish = 1;
        this.hue = 340; // Starts pinkish
    }

    update() {
        // Fluid Lagging Follow
        this.x += (this.targetX - this.x) * 0.15;
        this.squish += (1 - this.squish) * 0.1;
        this.hue += 0.5; // Slowly cycles colors
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(2 - this.squish, this.squish);

        // Gradient for the basket
        let grad = ctx.createLinearGradient(-this.w / 2, 0, this.w / 2, 0);
        grad.addColorStop(0, `hsl(${this.hue}, 100%, 60%)`);
        grad.addColorStop(1, `hsl(${this.hue + 40}, 100%, 70%)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Round the bottom corners for a "bowl" look
        ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, [0, 0, 25, 25]);
        ctx.fill();

        // Shine line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-this.w / 2 + 15, -this.h / 2 + 8);
        ctx.lineTo(this.w / 2 - 15, -this.h / 2 + 8);
        ctx.stroke();

        ctx.restore();
    }
}

class Heart {
    constructor() {
        this.size = Math.random() * 10 + 20;
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -50;
        this.speed = Math.random() * 2 + 3;
        this.angle = 0;
        this.swing = Math.random() * 2; // Sideways sway
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
        this.x += Math.sin(this.angle) * this.swing;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#ff4d6d';

        // Procedural Heart Shape
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2; t += 0.1) {
            let hX = 16 * Math.sin(t) ** 3;
            let hY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            ctx.lineTo(hX * (this.size / 30), hY * (this.size / 30));
        }
        ctx.fill();
        ctx.restore();
    }
}

// --- Effects ---

function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vX: (Math.random() - 0.5) * 10,
            vY: (Math.random() - 0.5) * 10,
            life: 1.0,
            size: Math.random() * 3 + 2
        });
    }
}

// --- Main Engine ---

function loop() {
    // Clear & Screen Shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
        screenShake *= 0.9;
    }

    ctx.fillStyle = '#1a0005'; // Dark romantic background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background Stars
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 192, 203, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) s.y = -10;
    });

    if (gameState === 'PLAYING') {
        player.update();
        player.draw();

        if (Math.random() < 0.04) hearts.push(new Heart());

        hearts.forEach((h, i) => {
            h.update();
            h.draw();

            // Collision
            let dx = h.x - player.x;
            let dy = h.y - player.y;
            if (Math.abs(dx) < player.w / 1.5 && Math.abs(dy) < 30) {
                hearts.splice(i, 1);
                score++;
                screenShake = 6;
                player.squish = 0.5;
                createParticles(h.x, h.y);

                loveMeter.style.width = `${(score / WIN_SCORE) * 100}%`;
                if (score >= WIN_SCORE) triggerProposal();
            }
            if (h.y > canvas.height + 50) hearts.splice(i, 1);
        });

        particles.forEach((p, i) => {
            p.x += p.vX; p.y += p.vY; p.life -= 0.03;
            if (p.life <= 0) particles.splice(i, 1);
            else {
                ctx.fillStyle = `rgba(255, 77, 109, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    ctx.restore();
    requestAnimationFrame(loop);
}

// --- Screen Transitions ---

function triggerProposal() {
    gameState = 'WIN';
    // Remove game UI and show proposal
    document.getElementById('ui-layer').classList.add('hidden');
    proposalScreen.classList.remove('hidden');
    proposalScreen.classList.add('active');
}

startBtn.addEventListener('click', () => {
    // THIS FIXES YOUR ISSUE: Toggle the classes properly
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');

    player = new Player();
    score = 0;
    hearts = [];
    gameState = 'PLAYING';
});

document.getElementById('yes-btn').addEventListener('click', () => {
    proposalScreen.classList.add('hidden');
    celebrationScreen.classList.remove('hidden');
    celebrationScreen.classList.add('active');
    // Massive heart burst
    for (let i = 0; i < 40; i++) createParticles(canvas.width / 2, canvas.height / 2);
});

// "No" Button Runner
const noBtn = document.getElementById('no-btn');
const runAway = () => {
    noBtn.style.position = 'absolute';
    noBtn.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    noBtn.style.top = Math.random() * (window.innerHeight - 50) + 'px';
};
noBtn.addEventListener('mouseover', runAway);
noBtn.addEventListener('touchstart', runAway);

window.addEventListener('mousemove', (e) => { if (player) player.targetX = e.clientX; });
window.addEventListener('touchmove', (e) => {
    if (player) player.targetX = e.touches[0].clientX;
    e.preventDefault();
}, { passive: false });

// Kickoff
window.addEventListener('resize', resize);
resize();
initBackground();
loop();