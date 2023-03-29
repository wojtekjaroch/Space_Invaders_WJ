//board
let tileSize = 32;
let rows = 16;
let columns = 16;

let board;
let boardWidth = tileSize * columns; //32 * 16
let boardHeight = tileSize * rows; //32 * 16
let context;

//ship
let shipWidth = tileSize*2;
let shipHeight = tileSize;
let shipX = tileSize * columns/2 - tileSize;
let shipY = tileSize * rows - tileSize*2;

let ship = {
    x : shipX,
    y : shipY,
    width : shipWidth,
    height : shipHeight
}

let shipImg;
let shipVelocityX = tileSize; // prędkość poruszania się statku

//aliens
let alienArray = [];
let alienWidth = tileSize*2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0; // ilość obcych do pokonania
let alienVelocityX = 1; //prędkość poruszania się obcych

//pociski
let bulletArray = [];
let bulletVelocityY = -10; //pociski poruszają się przeciwnie do kierunku osi Y, która jest skierowana w dół

let score = 0;
let gameOver = false;

const shotSound = new Audio('shot.mp3');
const explosionSound = new Audio('explosion.wav');



window.onload = function() {                // TO DO: zamienic na defer a nie window.onload
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d"); // used for drawing the board

    // draw initial ship
    // context.fillStyle="green";
    // context.fillRect(ship.x, ship.y, ship.width, ship.height);
    // zakomentowane, bo wrzucimy obrazek

    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function() {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }  
    
    alienImg = new Image();
    alienImg.src = "./alien.png";
    createAliens();

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);
}

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        return;
    }

    context.clearRect(0, 0, board.width, board.height);     //Rect - rectangle - czyli prostokąt

    //ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    //alien
    for (let i = 0; i < alienArray.length; i++ ) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            //jeśli obcy osiągnie granicę canvas, musi zmienić kierunek poruszania się 
            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX*2;

                //poruszanie się obcych o 1 rząd w kierunku statku
                for (let j = 0; j <alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
            }
        }
    }

    // pociski
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle="yellow";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // kolizja pocisków i obcych
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--; 
                score += 100;
                playExplosionSound()
            }
        }
    }
    
    // usuwanie pocisków poza canvas - aby nie zaśmiecać pamięci, co spowolni grę, należy usunąć pociski
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift(); // to usuwa 1-szy element array (tablicy)
    } // bulletArray.length > 0, czyli pociski są aktywne, symbol || oznacza LUB
    
    // kolejny poziom, kiedy zastrzeli się wszystkich obcych

    if (alienCount == 0) {
        // zwiększenie ilości obcych w kolumnach i rzędch o 1
        alienColumns = Math.min(alienColumns + 1, columns/2 - 2); // najwięcej będzie 16/2 -2 = 6 max 6 kolumn obcych
        alienRows = Math.min(alienRows + 1, rows - 4); // najwięcej będzie 16 - 4 = 12 max 12 rzędów obcych
        alienVelocityX += 0.2; // przyspiesza poruszanie się obcych
        alienArray = []; // usuwamy obcych (czysta tablica)
        bulletArray = []; // usuwamy pociski, aby nowych obcych nie zabił stary pocisk
        createAliens();
    }

    // wynik
    context.fillStyle="white";
    context.font="16px courier";
    context.fillText(score, 5, 20);
}

function moveShip(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
       ship.x -= shipVelocityX; // przesuwa w lewo z prędkością, jaką zadaliśmy (1 tile)
    }
    else if (e.code == "ArrowRight" && ship.x + shipVelocityX + ship.width <= board.width) {
        ship.x += shipVelocityX; // przesuwa w prawo
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img : alienImg,
                x : alienX + c*alienWidth,
                y : alienY + r*alienHeight,
                width : alienWidth,
                height : alienHeight,
                alive : true
            }
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}


function playShotSound() {
    shotSound.currentTime = 0; // Reset the audio to the beginning
    shotSound.play(); // Play the audio
  }

function playExplosionSound() {
    explosionSound.currentTime = 0; // Reset the audio to the beginning
    explosionSound.play(); // Play the audio
  }

function shoot(e) { 
    if (gameOver) {
        return;
    }
    // strzelanie
    if (e.code =="Space") {
      let bullet = {
        x : ship.x + shipWidth*15/32, // taki ułamek ułoży pocisk dokładnie na środku statku przy wylocie działa
        y : ship.y,
        width : tileSize/8,
        height : tileSize/2,
        used : false, //ustawiamy wartość boolean, która sprawdzi, czy pocisk uderzył lub nie w obcego, brak takiej wartości sprawi, że pocisk przeleci przez obcego i poleci dalej  
        }
        playShotSound()
        bulletArray.push(bullet);    
    }
}


    
function detectCollision(a, b) {
    return a.x < b.x + b.width &&   // górny lewy róg obiektu a (alien??) nie osiąga górnego prawego rogu obiektu b (bullet??) - tutaj chyba chodzi o kolejność podania zmiennych, a nie same nazwy
           a.x + a.width > b.x &&   // prawy górny róg obiektu a omija górny lewy róg obiektu b
           a.y < b.y + b.height &&  // górny lewy róg obiektu a nie osiąga dolnego lewego rogu obiektu b
           a.y + a.height > b.y;    // lewy dolny róg obiektu a omija lewy górny róg obiektu b
}