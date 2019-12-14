var isInit = false;
var socket = io();

var player;
var tanks = {};
var left = keyboard("ArrowLeft"); left.press = () => {};
var right = keyboard("ArrowRight"); right.press = () => {};
var up = keyboard("ArrowUp"); up.press = () => {};

var app = new PIXI.Application({ 
    width: 600,         // default: 800
    height: 400,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  }
);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(1000, 500);
app.renderer.view.style.left = ((window.innerWidth - app.renderer.width) >> 1) + 'px';

var gameScene = new PIXI.Container();
gameScene.sortableChildren = true;

socket.on('connect', function() {
    PIXI.loader.add([
        "./assets/sprites/tankBody_blue.png"
    ]).load(setup);
});


function setup() {

}


socket.on('initTankData', function(tankData) {
    var loadingText = document.getElementById('loading-text');
    loadingText.innerHTML = 'The game is about to begin!'
    setTimeout(function() {
        loadingText.style.visibility = "hidden";
        document.getElementById('loading-anim').style.visibility = "hidden";
    }, 1200);
    document.body.appendChild(app.view);
    console.log(tankData);
    //player = new Tank("/#"+socket.id, 150, 150, "blue");
    //gameScene.addChild(player.sprite);

    for (var tankid in tankData) {
        if (!tanks.hasOwnProperty(tankid)) {
            tanks[tankid] = new Tank(tankData[tankid].tankId, tankData[tankid].x, tankData[tankid].y, "blue");
            gameScene.addChild(tanks[tankid].sprite);
        }
    }
    console.log(tanks);

    if (!isInit) {
        isInit = true;
        app.stage.addChild(gameScene);

        app.ticker.add(delta => gameLoop(delta));
    }

});

socket.on('updateKeyPress', function(keyData) {
    console.log("key pressed");
    tanks[keyData.tankId].state[keyData.property] = keyData.value;
});

socket.on('updateKeyRelease', function(keyData) {
    console.log("key released");
    tanks[keyData.tankId].state[keyData.property] = keyData.value;
});





function gameLoop(delta) {
    if (tanks[socket.id].state.moveForward == false) {
        up.press = function() { socket.emit('keyboardPress', { tankId: socket.id, property: 'moveForward', value: true }) };
    } else if (tanks[socket.id].state.moveForward == true) {
        up.release = function() { socket.emit('keyboardRelease', { tankId: socket.id, property: 'moveForward', value: false }) };
    }

    if (tanks[socket.id].state.rotateLeft == false) {
        left.press = function() { socket.emit('keyboardPress', { tankId: socket.id, property: 'rotateLeft', value: true }) };
    } else if (tanks[socket.id].state.rotateLeft == true) {
        left.release = function() { socket.emit('keyboardRelease', { tankId: socket.id, property: 'rotateLeft', value: false }) };
    }

    if (tanks[socket.id].state.rotateRight == false) {
        right.press = function() { socket.emit('keyboardPress', { tankId: socket.id, property: 'rotateRight', value: true }) };
    } else if (tanks[socket.id].state.rotateRight == true) {
        right.release = function() { socket.emit('keyboardRelease', { tankId: socket.id, property: 'rotateRight', value: false }) };
    }


    for (var tankid in tanks) {
            if (tanks[tankid].state.moveForward) {
                console.log(tanks[tankid].state);
                let newx = tanks[tankid].sprite.x + (4.5*delta) * Math.cos(tanks[tankid].sprite.rotation);
                let newy = tanks[tankid].sprite.y + (4.5*delta) * Math.sin(tanks[tankid].sprite.rotation);
                tanks[tankid].sprite.x = newx;
                tanks[tankid].sprite.y = newy;
            }

            if (tanks[tankid].state.rotateLeft && !tanks[tankid].state.rotateRight) {
                tanks[tankid].sprite.rotation = tanks[tankid].sprite.rotation - (0.07 * delta);
            }

            if (tanks[tankid].state.rotateRight && !tanks[tankid].state.rotateLeft) {
                tanks[tankid].sprite.rotation = tanks[tankid].sprite.rotation + (0.07 * delta);
            }
    }




}


function Tank(tankId, posx, posy, team) {
    this.tankId = tankId;
    this.state = { moveForward: false, rotateLeft: false, rotateRight: false };
    this.sprite = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tankBody_blue.png"].texture);
    this.sprite.zIndex = 5;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = posx;
    this.sprite.y = posy;
    this.timer = 0;
    tanks[this.tankId] = this;
}