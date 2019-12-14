var isInit = false;
var socket = io();

var player;
var texBallPurple;
var tanks = {};
var balls = {};
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

var bump = new Bump(app.renderer);
var gameScene = new PIXI.Container();
gameScene.sortableChildren = true;

socket.on('connect', function() {
    PIXI.loader.add([
        "./assets/sprites/tankBody_blue.png",
        "./assets/sprites/tankBlue_barrel2_outline.png"
    ]).load(setup);
});


function setup() {
    var gr = new PIXI.Graphics();
    gr.beginFill(0x9966FF);
    gr.drawCircle(app.screen.width / 3, app.screen.height / 3, 6);
    gr.endFill();
    texBallPurple = app.renderer.generateTexture(gr);
    gr.clear();
}


socket.on('initTankData', function(tankData) {
    var loadingText = document.getElementById('loading-text');
    loadingText.innerHTML = 'The game is about to begin!'
    setTimeout(function() {
        loadingText.style.visibility = "hidden";
        document.getElementById('loading-anim').style.visibility = "hidden";
    }, 1200);
    document.getElementById('gameview').appendChild(app.view);
    console.log(tankData);
    //player = new Tank("/#"+socket.id, 150, 150, "blue");
    //gameScene.addChild(player.sprite);

    for (var tankid in tankData) {
        if (!tanks.hasOwnProperty(tankid)) {
            tanks[tankid] = new Tank(tankData[tankid].tankId, tankData[tankid].x, tankData[tankid].y, "blue");
            gameScene.addChild(tanks[tankid].sprite);
            gameScene.addChild(tanks[tankid].barrel);
        }
    }
    console.log(tanks);

    if (!isInit) {
        isInit = true;
        app.stage.addChild(gameScene);

        app.ticker.add(delta => gameLoop(delta));
    }

});


socket.on('initBallsData', function(ballsData) {
    for (var i = 0; i < ballsData.length; i++) {
        balls[ballsData[i].ballId] = new Ball(
            ballsData[i].ballId,
            ballsData[i].startX,
            ballsData[i].startY,
            texBallPurple
        );

        gameScene.addChild(balls[ballsData[i].ballId].sprite);
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

socket.on('setBallState', function(stateData) {
    balls[stateData.ballId].state = stateData.state;
    // if (stateData.state == 'used')
});

socket.on('disconnected', function(serverData) {
    gameScene.removeChild(tanks[serverData.tankId].sprite);
    gameScene.removeChild(tanks[serverData.tankId].barrel);
    tanks[serverData.tankId].sprite.destroy(false);
    tanks[serverData.tankId].barrel.destroy(false);
    delete tanks[serverData.tankId];
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
                //console.log(tanks[tankid].state);
                let newx = tanks[tankid].sprite.x + (4.5*delta) * Math.cos(tanks[tankid].sprite.rotation);
                let newy = tanks[tankid].sprite.y + (4.5*delta) * Math.sin(tanks[tankid].sprite.rotation);
                newx = newx < 1000-(tanks[tankid].sprite.width-12) && newx > (tanks[tankid].sprite.width-12) ? newx : tanks[tankid].sprite.x;
                newy = newy > (tanks[tankid].sprite.height-12) && newy < 500-(tanks[tankid].sprite.height-12) ? newy : tanks[tankid].sprite.y;
                tanks[tankid].sprite.x = newx;
                tanks[tankid].sprite.y = newy;
            }

            if (tanks[tankid].state.rotateLeft && !tanks[tankid].state.rotateRight) {
                tanks[tankid].sprite.rotation = tanks[tankid].sprite.rotation - (0.07 * delta);
            }

            if (tanks[tankid].state.rotateRight && !tanks[tankid].state.rotateLeft) {
                tanks[tankid].sprite.rotation = tanks[tankid].sprite.rotation + (0.07 * delta);
            }

            tanks[tankid].barrel.x = tanks[tankid].sprite.x;
            tanks[tankid].barrel.y = tanks[tankid].sprite.y;

            for (var ballid in balls) {
                let tankCollided = bump.hit(tanks[tankid].sprite, balls[ballid].sprite, false, false, false, function(collision, othersprite) {
                    // collided
                });
                if (tankCollided && balls[ballid].state == 'idle') {
                    socket.emit('changeBallState', {
                        ballId: ballid,
                        tankId: socket.id,
                        state: socket.id
                    });
                }

                if (balls[ballid].state != 'idle' && balls[ballid].state != 'used') {
                    balls[ballid].sprite.x = tanks[balls[ballid].state].sprite.x;
                    balls[ballid].sprite.y = tanks[balls[ballid].state].sprite.y;
                }
            }
    }

    tanks[socket.id].barrel.rotation = rotateToPoint(app.renderer.plugins.interaction.mouse.global.x, app.renderer.plugins.interaction.mouse.global.y, tanks[socket.id].barrel.x, tanks[socket.id].barrel.y);
    

    

    /*tanks[socket.id].updateTimer += 1;
    if (tanks[socket.id].updateTimer > 30) {
        socket.emit('updateClientData', {
            x: tanks[socket.id].sprite.x,
            y: tanks[socket.id].sprite.y,
            rotation: tanks[socket.id].sprite.rotation,
            moveForward: tanks[socket.id].state.moveForward,
            rotateLeft: tanks[socket.id].state.rotateLeft,
            rotateRight: tanks[socket.id].state.rotateRight,

        });
    }*/
}



function rotateToPoint(mx, my, px, py) {  
    var self = this;
    var dist_Y = my - py;
    var dist_X = mx - px;
    var angle = Math.atan2(dist_Y,dist_X);
    //var degrees = angle * 180/ Math.PI;
    return angle;
}



function Tank(tankId, posx, posy, team) {
    this.tankId = tankId;
    this.state = { moveForward: false, rotateLeft: false, rotateRight: false };
    this.sprite = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tankBody_blue.png"].texture);
    this.barrel = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tankBlue_barrel2_outline.png"].texture);
    this.sprite.zIndex = 5;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = posx;
    this.sprite.y = posy;
    this.barrel.zIndex = 10;
    this.barrel.anchor.set(0, 0.5);
    this.barrel.x = posx;
    this.barrel.y = posy;
    this.updateTimer = 0;
    tanks[this.tankId] = this;
}



function Ball(ballId, init_x, init_y, init_color) {
    this.ballId = ballId;
    this.state = 'idle';
    this.sprite = new PIXI.Sprite(init_color);
    this.sprite.zIndex = 15;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
  
    balls[this.ballId] = this;
  }
  