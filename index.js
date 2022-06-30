firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        user.providerData.forEach((profile) => {
            // console.log("  Provider-specific UID: " + profile.uid);
            // console.log("  Name: " + profile.displayName);
            // console.log("  Email: " + profile.email);
            // console.log("  Photo URL: " + profile.photoURL);
            console.log(profile)
                  
            document.getElementById("user-initial").innerHTML = profile.displayName.charAt(0);
            document.getElementById("user-initial1").innerHTML = profile.displayName.charAt(0);
            document.getElementById("username").innerHTML = profile.displayName;
            document.getElementById("useremail").innerHTML = profile.email;
        })
        document.getElementById("hightscore").innerHTML = localStorage.getItem('Highscore');

    }
})


/*VIEW PROFILE POP UP*/
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function () {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

/*LOG OUT CODE*/

const logout = document.getElementById("logout-btn");
logout.addEventListener('click', (e) => {
    e.preventDefault();
    firebase.auth().signOut().then(function () {
        //console.log('Signed Out');
        window.location.replace("login.html");
    }, function (error) {
        console.error('Sign Out Error', error);
    });
})

var camera = undefined,
    scene = undefined,
    renderer = undefined,
    light = undefined,
    mouseX = undefined,
    mouseY = undefined,
    maze = undefined,
    mazeMesh = undefined,
    mazeDimension = 11,
    coinMesh = undefined,
    planeMesh = undefined,
    ballMesh = undefined,
    destroyerMesh = undefined,
    collisioneffect = undefined,
    coineffect = undefined,
    flagimg = undefined,
    coinRadius = 0.25,
    ballRadius = 0.25,
    keyAxis = [0, 0],
    ironTexture = THREE.ImageUtils.loadTexture('/ball.png'),
    planeTexture = THREE.ImageUtils.loadTexture('/concrete.png'),
    brickTexture = THREE.ImageUtils.loadTexture('/brick.png'),
    flagTexture = THREE.ImageUtils.loadTexture('images/flag.jpg'),
    shieldTexture = THREE.ImageUtils.loadTexture('images/shi.png'),
    gameState = undefined,
    destroyflag,
    obstacleFlag = false,
    destroyerPath = [],
    noofDestroyer = undefined,
    shieldPath = [],
    noofShield = undefined,
    phyPath = undefined,
    obsatacle,
    levelscore,
    scores = 0;
    isLocked = false;
    hit = 0;
    clock = undefined,
    allUsersData = [];
    let userData;
    startGameSound = "audio/welcomesound.mp3"

// Box2D shortcuts
b2World = Box2D.Dynamics.b2World,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2Settings = Box2D.Common.b2Settings,
    b2Vec2 = Box2D.Common.Math.b2Vec2,

    // Box2D world variables 
    wWorld = undefined,
    wBall = undefined;
    cBall = undefined;
    dball = undefined;

var coins = [];
var shield = [];
var sound = document.createElement('audio');

function createPhysicsWorld() {
    // Create the world object.
    wWorld = new b2World(new b2Vec2(0, 0), true);

    // Create the ball.
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(1, 1);
    wBall = wWorld.CreateBody(bodyDef);
    var fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.userData = "ball";
    fixDef.friction = 0.0;
    fixDef.restitution = 0.25;
    fixDef.shape = new b2CircleShape(ballRadius);
    wBall.CreateFixture(fixDef);

    // Create the maze.
    bodyDef.type = b2Body.b2_staticBody;
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(0.5, 0.5);
    fixDef.userData = 'wall'
    for (var i = 0; i < maze.dimension; i++) {
        for (var j = 0; j < maze.dimension; j++) {
            if (maze[i][j]) {
                bodyDef.position.x = i;
                bodyDef.position.y = j;
                wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
            }

        }
    }

    //Create a coin
    for (var i = 0; i < maze.dimension; i++) {
        for (var j = i + 1; j < maze.dimension; j++) {
            if (!maze[i][j]) {
                bodyDef.type = b2Body.b2_dynamicBody;
                bodyDef.position.x = i;
                bodyDef.position.y = j;
                bodyDef.userData = `${i}${j}`
                //bodycoin.position.Set(i+0.8, j);
                cBall = wWorld.CreateBody(bodyDef);
                fixDef.density = 1.0;
                fixDef.friction = 0.0;
                fixDef.userData = "coin";
                fixDef.restitution = 0.25;
                fixDef.shape = new b2CircleShape(coinRadius - 0.1);
                cBall.CreateFixture(fixDef);
            }

        }
    }
}
const animAudio = (audiolink) => {
    const audio = new Audio(audiolink);
    audio.play()
};

function generate_maze_mesh(field) {
    var dummy = new THREE.Geometry();
    for (var i = 0; i < field.dimension; i++) {
        for (var j = 0; j < field.dimension; j++) {
            if (field[i][j]) {
                var geometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
                var mesh_ij = new THREE.Mesh(geometry);
                mesh_ij.position.x = i;
                mesh_ij.position.y = j;
                mesh_ij.position.z = 0.5;
                THREE.GeometryUtils.merge(dummy, mesh_ij);

            }
        }
    }
    var material = new THREE.MeshPhongMaterial({
        map: brickTexture
    });
    var mesh = new THREE.Mesh(dummy, material)
    return mesh;
}


//Place a coin to maze path
function generate_coin_mesh(field) {
    var dummy = new THREE.Geometry();
    let material = new THREE.MeshLambertMaterial({color: 0xF5C000});
    for (var i = 0; i < field.dimension; i++) {
        for (var j = i + 1; j < field.dimension; j++) {
            if (!field[i][j]) {
                var rotate = 0.0;
                var increment = 100;
                const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 100);
                let cube = new THREE.Mesh(geometry, material);
                cube.position.x = i;
                cube.position.y = j;
                cube.position.z = 0.5;
                cube.rotation.y = 0;
                cube.rotation.z = 0;
                setInterval(() => {
                    cube.rotation.x = rotate += 0.01;
                }, increment);
                cube.userData = `${i}${j}`;
                coins.push(cube);
                scene.add(cube);
            }

        }
    }
    var coinmaterial = new THREE.Mesh(dummy, material)
    return coinmaterial;
}

//create Destroyer
const addDestroyer = (path) => {
    if (isLocked == false) {
        console.log("destroyer");
        const g = new THREE.SphereGeometry(0.3, 0.3, 0.1, 120);
        let m = new THREE.MeshPhongMaterial({color: 0xFF0000});
        let destroyerMesh = new THREE.Mesh(g, m);
        destroyerMesh.position.set(path.x + 0.5, path.y + 0.5, 0.3);
        scene.add(destroyerMesh);

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_staticBody;
        bodyDef.userData = `${path.x}${path.y}`;
        bodyDef.position.Set(path.x + 0.5, path.y + 0.5, 0.3);
        dBall = wWorld.CreateBody(bodyDef);
        var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.userData = "obstacles";
        fixDef.friction = 0.0;
        fixDef.restitution = 0.25;
        fixDef.shape = new b2CircleShape(ballRadius);
        dBall.CreateFixture(fixDef);
        // isLocked = false;
    }
};

//Add destroyer
const obstacles = () => {
    const maze = generateSquareMaze(mazeDimension);
    maze[mazeDimension - 1][mazeDimension - 2] = false;
    level = Math.floor((mazeDimension - 1) / 2 - 4);
    const arrOfX = [];
    const cords = [];

    maze.forEach((items, index) => {
        if (maze[index].indexOf(false) !== -1) {
            arrOfX.push(index);
        }
    });

    arrOfX.forEach((item) => {
        maze[item].forEach((items, indx) => {
            if (items === false) {
                cords.push({
                    x: item,
                    y: indx
                });
            }
        });
    });

    obsPerLevel = level % 2 !== 0 ? level + 1 : level;
    var middleIndex = Math.ceil(Math.ceil(cords.length / obsPerLevel) / 2);
    const chunkArray = (myArray, chunk_size) => {
    var results = [];

    while (myArray.length) {
        results.push(myArray.splice(0, chunk_size));
    }
return results;
    };

    var result = chunkArray(cords, middleIndex);
    result.forEach((item, index) => {
        destroyerPath.push({
            fPath: item[item.length - 1],

            oPath: item[item.length - 5],
        });
    });
};

//Create shield
const addShield = (path) => {
    if (isLocked == false) {
        console.log("shield");
        const g = new THREE.SphereGeometry(0.3, 0.3, 0.1, 120);
        let m = new THREE.MeshPhongMaterial({map: shieldTexture});
        let shiledMesh = new THREE.Mesh(g, m);
        shiledMesh.position.set(path.x, path.y, 0.3);
        shiledMesh.userData = `${path.x}${path.y}`;
        shield.push(shiledMesh);
        scene.add(shiledMesh);

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_staticBody;
        bodyDef.userData = `${path.x}${path.y}`;
        bodyDef.position.Set(path.x, path.y, 0.3);
        dBall = wWorld.CreateBody(bodyDef);
        var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.userData = "Shield";
        fixDef.friction = 0.0;
        fixDef.restitution = 0.25;
        fixDef.shape = new b2CircleShape(ballRadius);
        dBall.CreateFixture(fixDef);
        // isLocked = false;
    }
};

//Add shield
const shields = () => {
    const maze = generateSquareMaze(mazeDimension);
    maze[mazeDimension - 1][mazeDimension - 2] = false;
    level = Math.floor((mazeDimension - 1) / 2 - 4);
    const arrOfy = [];
    const cords = [];

    maze.forEach((items, index) => {
        if (maze[index].indexOf(false) !== -1) {
            arrOfy.push(index);
        }
    });

    arrOfy.forEach((item) => {
        maze[item].forEach((items, indx) => {
            if (items === false) {
                cords.push({
                    x: item,
                    y: indx
                });
            }
        });
    });

    shiledPerLevel = level % 2 !== 0 ? level + 1 : level;
    var middleIndex = Math.ceil(Math.ceil(cords.length / shiledPerLevel) / 2);
    const chunkArray = (myArray, chunk_size) => {
        var results = [];

        while (myArray.length) {
            results.push(myArray.splice(0, chunk_size));
        }

        return results;
    };

    var result = chunkArray(cords, middleIndex);
    result.forEach((item, index) => {
        shieldPath.push({
            fPath: item[item.length - 1],
            oPath: item[item.length - 5],
        });
    });
};




function createRenderWorld() {

    // Create the scene object.
    scene = new THREE.Scene();

    // Add the light.
    light = new THREE.PointLight(0xffffff, 1);
    light.position.set(1, 1, 1.3);
    scene.add(light);

    // Add the ball.
    g = new THREE.SphereGeometry(ballRadius, 32, 16);
    m = new THREE.MeshPhongMaterial({
        map: ironTexture
    });
    ballMesh = new THREE.Mesh(g, m);
    ballMesh.position.set(1, 1, ballRadius);
    scene.add(ballMesh);

    g = new THREE.SphereGeometry(0.3, 32, 16);
    m = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    collisioneffect = new THREE.Mesh(g, m);

    g = new THREE.SphereGeometry(0.5, 35, 17);
    m = new THREE.MeshPhongMaterial({  color: 0xff2cf3 });
    coineffect = new THREE.Mesh(g, m);

    // Add the camera.
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.set(1, 1, 5);
    scene.add(camera);

    // Add the maze.
    mazeMesh = generate_maze_mesh(maze);
    scene.add(mazeMesh);

    //Add coin maze
    coinMesh = generate_coin_mesh(maze);
    scene.add(coinMesh);

    //Adding flag at end of game
    g = new THREE.CubeGeometry(0.2, 1, 2, 1);
    m = new THREE.MeshPhongMaterial({map: flagTexture});
    flagimag = new THREE.Mesh(g, m);
    flagimag.position.set(mazeDimension - 1, mazeDimension - 2, 0);
    flagimag.rotation.y = 0.5;
    scene.add(flagimag);


    // Add the ground.
    g = new THREE.PlaneGeometry(mazeDimension * 10, mazeDimension * 10, mazeDimension, mazeDimension);
    planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
    planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
    m = new THREE.MeshPhongMaterial({
        map: planeTexture
    });
    planeMesh = new THREE.Mesh(g, m);
    planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
    planeMesh.rotation.set(Math.PI / 2, 0, 0);
    scene.add(planeMesh);

}


function updatePhysicsWorld() {

    // Apply "friction". 
    var lv = wBall.GetLinearVelocity();
    lv.Multiply(0.8);
    wBall.SetLinearVelocity(lv);

    // Apply user-directed force.
    var f = new b2Vec2(keyAxis[0] * wBall.GetMass() * 0.25, keyAxis[1] * wBall.GetMass() * 0.25);
    wBall.ApplyImpulse(f, wBall.GetPosition());
    keyAxis = [0, 0];

    // Take a time step.
    wWorld.Step(1 / 60, 8, 3);
    
    if (Math.floor(wBall.GetPosition().x) > mazeDimension - 4 && Math.floor(wBall.GetPosition().y) > mazeDimension - 4) {
        scene.add(flagimag);
        flagimag.userData = 'flag';
    }
    else {
        scene.remove(flagimag);
    }
}
const coinArray = [];
const shieldArray = [];
const scorearray = [];
var highscore = 0;
let isPowerON = false;
const onContact = (contact) => {

    var fixtureA = contact.GetFixtureA();
    var fixtureB = contact.GetFixtureB();

    if (fixtureA.GetUserData() === "ball" && fixtureB.GetUserData() === "coin") {
        ballMesh.material.map = THREE.ImageUtils.loadTexture('images/coin.jpg');
        ballMesh.material.needsUpdate = true;
        setTimeout(() => {
            ballMesh.material.map = THREE.ImageUtils.loadTexture('/ball.png');
            ballMesh.material.needsUpdate = true;
        }, 500);
        var audio = new Audio('audio/coin.mp3');
        audio.play();
        scores = scores + 1;
        document.getElementById('score').innerHTML = "Score:" + scores;
        coinArray.push(fixtureB);
        scorearray.push(scores);
        let highestscore = scorearray.slice(-1);
        
        function createItem() {
            localStorage.setItem('Highscore', highestscore); 
        } 
        createItem() // Creates a item named 'Highscore' and stores a value of Highscore
        
        function getValue() {
            return localStorage.getItem('Highscore');  
        } // Gets the value of 'Highscore' and returns it
        console.log(getValue()); // Highestscore;



    } else if (fixtureA.GetUserData() === "wall" && fixtureB.GetUserData() === "ball") {
        hit += 1;
        ballMesh.material.map = THREE.ImageUtils.loadTexture('images/ckr.jpg');
        ballMesh.material.needsUpdate = true;
        setTimeout(() => {
            ballMesh.material.map = THREE.ImageUtils.loadTexture('/ball.png');
            ballMesh.material.needsUpdate = true;
        }, 200);
        var audio = new Audio('audio/hit.mp3');
        audio.play();

        var modal1 = document.getElementById("myModal1");
        if (hit > 3) {
            async function delay() {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(2);
                    }, 2000);
                });
            }

            async function sample() {
                modal1.style.display = "block";
                var audio = new Audio('audio/game-over.wav');
                audio.play();
                let delayres = await delay(2000);
                modal1.style.display = "none";
                gameState = 'fade out';
                location.replace("index.html");
            }
            sample();
            hit = 0;
            score = 0;
            document.getElementById('score').innerHTML = "Score:" + scores;
        }
    }
    else if (fixtureA.GetUserData() === "ball" && fixtureB.GetUserData() === "obstacles") {
        if(isPowerON == false){

        var modal2 = document.getElementById("myModal2");

        async function delay() {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(2);
                }, 2000);
            });
        }
      
        async function sample1() {
            modal2.style.display = "block";
            var audio = new Audio('audio/game-over.wav');
            audio.play();
            let delayres = await delay();
            modal2.style.display = "none";
            gameState = 'fade out';
        }
        sample1();
        score = 0;
        document.getElementById('score').innerHTML = "Score:" + scores;
    }
}
    else if (fixtureA.GetUserData() === "ball" && fixtureB.GetUserData() === "Shield") {
        shieldArray.push(fixtureB);
        ballMesh.material.map = THREE.ImageUtils.loadTexture("images/shi.png");
        ballMesh.material.needsUpdate = true;
        isPowerON = true;
        console.log("before 20sec"+ isPowerON)


        setTimeout(() => {
            isPowerON = false;
            console.log("after 20sec"+ isPowerON)
            ballMesh.material.map = THREE.ImageUtils.loadTexture('ball.png');
            ballMesh.material.needsUpdate = true;
        }, 20000)

    }

}

function updateRenderWorld() {

    // Update ball position.
    var stepX = wBall.GetPosition().x - ballMesh.position.x;
    var stepY = wBall.GetPosition().y - ballMesh.position.y;
    ballMesh.position.x += stepX;
    ballMesh.position.y += stepY;

    // Update ball rotation.
    var tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix);

    // Update camera and light positions.
    camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
    camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
    camera.position.z += (5 - camera.position.z) * 0.1;
    light.position.x = camera.position.x;
    light.position.y = camera.position.y;
    light.position.z = camera.position.z - 3.7;
}
const removeCoins = (assests) => {
    if (!wWorld.IsLocked()) {
        if (assests.length > 0) {
            assests.forEach((assest) => {
                wWorld.DestroyBody(assest.m_body);
                coins.forEach((coin) => {
                    if (coin.userData == assest.m_body.m_userData) {
                        scene.remove(coin);
                    }
                })
            });
        }
    }
}
const removeShield = (assests) => {
    if (!wWorld.IsLocked()) {
        if (assests.length > 0) {
            assests.forEach((assest) => {
                wWorld.DestroyBody(assest.m_body);
                shield.forEach((shield) => {
                    if (shield.userData == assest.m_body.m_userData) {
                        scene.remove(shield);
                    }
                })
            });
        }
    }
}

function gameLoop() {

    switch (gameState) {

        case 'initialize':
            obstacles();
            shields();
            IsLocked = true;
            maze = generateSquareMaze(mazeDimension);
            maze[mazeDimension - 1][mazeDimension - 2] = false;
            createPhysicsWorld();
            createRenderWorld();
            camera.position.set(1, 1, 5);
            light.position.set(1, 1, 1.3);
            light.intensity = 0;
            var level = Math.floor((mazeDimension - 1) / 2 - 4);
            $('#level').html('Level ' + level);
            gameState = 'fade in';
            break;

        case 'fade in':
            light.intensity += 0.1 * (1.0 - light.intensity);
            renderer.render(scene, camera);
            if (Math.abs(light.intensity - 1.0) < 0.05) {
                light.intensity = 1.0;
                gameState = 'play'
                clock = new THREE.Clock;
                clock.start();
            }

            break;

        case 'play':
            // Check for victory.
            var mazeX = Math.floor(ballMesh.position.x + 0.5);
            var mazeY = Math.floor(ballMesh.position.y + 0.5);
            IsLocked = false;
            destroyerPath.forEach((item, index) => {
                if (item.fPath.x == mazeX && item.fPath.y == mazeY) {
                    IsLocked = false;
                    addDestroyer(item.oPath);
                }
                else if (mazeX > item.fPath.x && mazeY == item.fPath.y) {
                    IsLocked = true;
                }
            });
            shieldPath.forEach((item, index) => {
                if (item.fPath.x == mazeX && item.fPath.y == mazeY) {
                    IsLocked = false;
                    addShield(item.oPath);
                }
                else if (mazeX > item.fPath.x && mazeY == item.fPath.y) {
                    IsLocked = true;
                }
            });

            updatePhysicsWorld();
            updateRenderWorld();
            renderer.render(scene, camera);
            var listener = new Box2D.Dynamics.b2ContactListener;
            listener.BeginContact = function (contact) {
                onContact(contact);
            }
            wWorld.SetContactListener(listener);
            removeCoins(coinArray);
            removeShield(shieldArray);

            if (mazeX == mazeDimension && mazeY == mazeDimension - 2) {
                mazeDimension += 2;
                gameState = 'fade out';
            }


            break;

        case 'fade out':
            updatePhysicsWorld();
            updateRenderWorld();
            light.intensity += 0.1 * (0.0 - light.intensity);
            renderer.render(scene, camera);
            if (Math.abs(light.intensity - 0.0) < 0.1) {
                light.intensity = 0.0;
                renderer.render(scene, camera);
                gameState = 'initialize';
                clock.stop();
                console.log("EndTime:", clock.getElapsedTime());
            }
            break;

    }

    requestAnimationFrame(gameLoop);

}


function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
// function updateScore() {
//     // const theuser = firebase.auth().currentUser;
//     // console.log(theuser.email)
//     // theuser.updateProfile({
//     //   score:'1'
//     // })
//     // console.log(theuser.score)
//     firebase.auth().onAuthStateChanged(function (user) {
//         if (user) {
//             user.providerData.forEach((profile) => {
//                 // console.log("  Provider-specific UID: " + profile.uid);
//                 // console.log("  Name: " + profile.displayName);
//                 // console.log("  Email: " + profile.email);
//                 // console.log("Score:"+scores)
//             });
//             user.providerData[0]['score'] = scores;
//             user.providerData[0]['EndTime'] = clock.getElapsedTime()
//             userData = user.providerData;
//             allUsersData = [];
//             allUsersData.push(userData);
//             console.log(allUsersData)
//         }
//     });


// }


function onMoveKey(axis) {
    keyAxis = axis.slice(0);
}


jQuery.fn.centerv = function () {
    wh = window.innerHeight;
    h = this.outerHeight();
    this.css("position", "absolute");
    this.css("top", Math.max(0, (wh - h) / 2) + "px");
    return this;
}


jQuery.fn.centerh = function () {
    ww = window.innerWidth;
    w = this.outerWidth();
    this.css("position", "absolute");
    this.css("left", Math.max(0, (ww - w) / 2) + "px");
    return this;
}


jQuery.fn.center = function () {
    this.centerv();
    this.centerh();
    return this;
}


$(document).ready(function () {

    // Prepare the instructions.
    $('#instructions').center();
    $('#instructions').hide();
    KeyboardJS.bind.key('i', function () {
        $('#instructions').show()
    },
        function () {
            $('#instructions').hide()
        });

    // Create the renderer.
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Bind keyboard and resize events.
    KeyboardJS.bind.axis('left', 'right', 'down', 'up', onMoveKey);
    KeyboardJS.bind.axis('h', 'l', 'j', 'k', onMoveKey);

//     var el = document.getElementsByTagName("canvas")[0];
// el.addEventListener("touchstart", handleStart);
// el.addEventListener("touchmove", handleMove);
// el.addEventListener("touchend", handleEnd);
// el.addEventListener("touchcancel", handleCancel);

    $(window).resize(onResize);


    // Set the initial game state.
    gameState = 'initialize';
    //animAudio(startGameSound);

    // Start the game loop.
    requestAnimationFrame(gameLoop);

})
