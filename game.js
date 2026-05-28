// === НАСТРОЙКИ СЦЕНЫ И НЕОНОВЫЕ ОБЪЕКТЫ ===
let scene, camera, renderer, player, ball;
let bots = [];
let currentTarget = null;

let keys = { w: false, a: false, s: false, d: false, Space: false };
let ballSpeed = 0.18;
let ballDirection = new THREE.Vector3();
let score = 0;
let isBlocking = false;
let blockCooldown = false;

const ARENA_SIZE = 25;
const BOT_COUNT = 3;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a16); // Тёмно-синий космос
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Пол арены 
    const floorGeo = new THREE.BoxGeometry(ARENA_SIZE * 2, 0.5, ARENA_SIZE * 2);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x1f1f2e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    scene.add(floor);

    // Красная неоновая сетка разметки
    const grid = new THREE.GridHelper(ARENA_SIZE * 2, 20, 0xff2e63, 0x333344);
    grid.position.y = 0.01;
    scene.add(grid);

    // Игрок (Яркая неоново-синяя 3D-сфера)
    const playerGeo = new THREE.SphereGeometry(1, 16, 16);
    const playerMat = new THREE.MeshBasicMaterial({ color: 0x00adb5 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1, 15);
    player.isPlayer = true;
    player.isAlive = true;
    scene.add(player);

    // Смертоносный красный 3D мяч
    const ballGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xff2e63 });
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 1, -10);
    scene.add(ball);

    createBots();

    window.addEventListener('keydown', (e) => handleInput(e, true));
    window.addEventListener('keyup', (e) => handleInput(e, false));
    window.addEventListener('resize', onWindowResize);

    selectNewTarget();
    animate();
}

function createBots() {
    bots.forEach(b => scene.remove(b));
    bots = [];
    const botGeo = new THREE.SphereGeometry(1, 16, 16);

    for (let i = 0; i < BOT_COUNT; i++) {
        // Боты (Яркие фиолетовые сферы)
        const botMat = new THREE.MeshBasicMaterial({ color: 0x9b5de5 });
        const bot = new THREE.Mesh(botGeo, botMat);
        bot.position.set((Math.random() - 0.5) * (ARENA_SIZE * 1.4), 1, (Math.random() - 0.5) * (ARENA_SIZE * 1.4));
        bot.isPlayer = false;
        bot.isAlive = true;
        bot.aiTimer = 0;
        bot.moveDir = new THREE.Vector3();
        bot.isBlocking = false;
        bots.push(bot);
        scene.add(bot);
    }
}

function selectNewTarget(exception) {
    let pool = [];
    if (player && player.isAlive && player !== exception) pool.push(player);
    bots.forEach(b => {
        if (b.isAlive && b !== exception) pool.push(b);
    });

    if (pool.length === 0 && exception && exception.isAlive) {
        pool.push(exception);
    }

    if (pool.length > 0) {
        currentTarget = pool[Math.floor(Math.random() * pool.length)];
        bots.forEach(b => { if(b.isAlive) b.material.color.setHex(0x9b5de5); });
        if (player && player.isAlive && !isBlocking) player.material.color.setHex(0x00adb5);
        
        if (currentTarget !== player) {
            currentTarget.material.color.setHex(0xff9f1c); // Цель подсвечивается оранжевым
        }
    } else {
        currentTarget = null;
    }
    updateAliveCounter();
}

function updateAliveCounter() {
    let count = ((player && player.isAlive) ? 1 : 0) + bots.filter(b => b.isAlive).length;
    document.getElementById('bots-count').innerText = count;
    
    if (count === 1 && player && player.isAlive) {
        alert("ПОБЕДА! Вы уничтожили всех ботов!");
        restartGame();
    }
}

function restartGame() {
    if (!player || !ball) return;
    player.isAlive = true;
    player.position.set(0, 1, 15);
    player.material.color.setHex(0x00adb5);
    
    createBots();
    
    ball.position.set(0, 1, -10);
    ballSpeed = 0.18;
    score = 0;
    document.getElementById('score').innerText = score;
    
    selectNewTarget();
}

function handleInput(e, isDown) {
    let key = e.key.toLowerCase();
    if (e.code === 'Space') key = 'Space';
    if (e.key === 'ArrowUp') key = 'w';
    if (e.key === 'ArrowDown') key = 's';
    if (e.key === 'ArrowLeft') key = 'a';
    if (e.key === 'ArrowRight') key = 'd';

    if (keys.hasOwnProperty(key)) keys[key] = isDown;

    if (key === 'Space' && isDown && !blockCooldown && !isBlocking && player && player.isAlive) {
        triggerPlayerBlock();
    }
}

function triggerPlayerBlock() {
    isBlocking = true;
    blockCooldown = true;
    player.material.color.setHex(0x00ff00); // Зеленый цвет щита

    setTimeout(() => {
        isBlocking = false;
        if (currentTarget === player) player.material.color.setHex(0xff9f1c);
        else player.material.color.setHex(0x00adb5);
        
        setTimeout(() => { blockCooldown = false; }, 400);
    }, 300); // Блок активен 300мс
}

function animate() {
    requestAnimationFrame(animate);

    if (!player || !ball) return;

    // 1. Движение игрока
    if (player.isAlive) {
        const moveSpeed = 0.22;
        if (keys.w && player.position.z > -ARENA_SIZE) player.position.z -= moveSpeed;
        if (keys.s && player.position.z < ARENA_SIZE) player.position.z += moveSpeed;
        if (keys.a && player.position.x > -ARENA_SIZE) player.position.x -= moveSpeed;
        if (keys.d && player.position.x < ARENA_SIZE) player.position.x += moveSpeed;
    }

    // 2. Движение и авто-блок ботов
    bots.forEach(bot => {
        if (!bot.isAlive) return;

        bot.aiTimer--;
        if (bot.aiTimer <= 0) {
            bot.aiTimer = Math.random() * 60 + 30;
            bot.moveDir.set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1).normalize();
        }

        bot.position.addScaledVector(bot.moveDir, 0.12);
        
        bot.position.x = Math.max(-ARENA_SIZE + 1, Math.min(ARENA_SIZE - 1, bot.position.x));
        bot.position.z = Math.max(-ARENA_SIZE + 1, Math.min(ARENA_SIZE - 1, bot.position.z));

        let distToBall = bot.position.distanceTo(ball.position);
        if (currentTarget === bot && distToBall < (3.0 + ballSpeed * 5) && !bot.isBlocking) {
            let reactionChance = Math.random();
            if (reactionChance > (ballSpeed * 0.5 - 0.05)) { 
                bot.isBlocking = true;
                bot.material.color.setHex(0xffffff); // Белая вспышка блока бота
                
                setTimeout(() => {
                    bot.isBlocking = false;
                    if (bot.isAlive) bot.material.color.setHex(0x9b5de5);
                }, 250);
            }
        }
    });

    // 3. Логика преследования мяча
    if (currentTarget && currentTarget.isAlive) {
        let targetDir = new THREE.Vector3().subVectors(currentTarget.position, ball.position).normalize();
        ballDirection.lerp(targetDir, 0.08); 
        ball.position.addScaledVector(ballDirection, ballSpeed);

        const distance = currentTarget.position.distanceTo(ball.position);

        if (distance < 3.5) {
            let isTargetBlocking = currentTarget.isPlayer ? isBlocking : currentTarget.isBlocking;

            if (isTargetBlocking) {
                ballSpeed += 0.025; // Мяч ускоряется
                if (currentTarget.isPlayer) {
                    score++;
                    document.getElementById('score').innerText = score;
                }
                selectNewTarget(currentTarget);
            } 
            else if (distance < 1.4) {
                if (currentTarget.isPlayer) {
                    player.isAlive = false;
                    alert(`Вы выбыли! Счёт отбиваний: ${score}`);
                    restartGame();
                } else {
                    currentTarget.isAlive = false;
                    scene.remove(currentTarget);
                    ballSpeed = Math.max(0.18, ballSpeed - 0.05);
                    selectNewTarget();
                }
            }
        }
    } else {
        selectNewTarget();
    }

    // 4. Следование 3D-камеры
    if (player.isAlive) {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, player.position.y + 6, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, player.position.z + 12, 0.08);
        camera.lookAt(player.position.x, player.position.y + 1, player.position.z - 2);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Запускаем игру ТОЛЬКО после того, как браузер полностью загрузит Three.js
window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') {
        init();
    } else {
        console.error("Библиотека Three.js не успела прогрузиться. Перезагрузите страницу.");
    }
});
