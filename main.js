let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });

renderer.setSize(window.innerWidth, window.innerHeight);

// LIGHT
let light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// FLOOR
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// WALLS / MAP
let walls = [];

function createWall(x,z,w,h,d) {
  let wall = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color: 0x3333ff })
  );
  wall.position.set(x,h/2,z);
  scene.add(wall);
  walls.push(wall);
}

// Arena walls
createWall(0,-20,40,5,1);
createWall(0,20,40,5,1);
createWall(-20,0,1,5,40);
createWall(20,0,1,5,40);

// Obstacles
for(let i=0;i<10;i++){
  createWall(
    (Math.random()-0.5)*30,
    (Math.random()-0.5)*30,
    2,3,2
  );
}

// PLAYER
camera.position.set(0,1.6,5);

// STATS
let health = 100;
let score = 0;

// WEAPONS
let weapons = {
  pistol: { ammo: 10, max: 10, damage: 1, fireRate: 400 },
  rifle: { ammo: 30, max: 30, damage: 1, fireRate: 100 }
};

let currentWeapon = "pistol";
let lastShot = 0;

// UI
function updateHUD(){
  document.getElementById("health").innerText = "Health: "+health;
  document.getElementById("ammo").innerText = currentWeapon.toUpperCase()+" Ammo: "+weapons[currentWeapon].ammo;
  document.getElementById("score").innerText = "Score: "+score;
}

// SWITCH WEAPON (PC keys)
document.addEventListener("keydown", e=>{
  if(e.key==="1") currentWeapon="pistol";
  if(e.key==="2") currentWeapon="rifle";
  updateHUD();
});

// SHOOT
let raycaster = new THREE.Raycaster();

function shoot(){
  let now = Date.now();
  let weapon = weapons[currentWeapon];

  if(now - lastShot < weapon.fireRate) return;
  if(weapon.ammo <= 0) return;

  weapon.ammo--;
  lastShot = now;

  raycaster.setFromCamera(new THREE.Vector2(0,0), camera);

  let hit = raycaster.intersectObjects(enemies);

  if(hit.length > 0){
    let enemy = hit[0].object;
    enemy.health -= weapon.damage;

    if(enemy.health <= 0){
      scene.remove(enemy);
      enemies.splice(enemies.indexOf(enemy),1);
      score++;
    }
  }

  updateHUD();
}

// RELOAD
function reload(){
  let w = weapons[currentWeapon];
  w.ammo = w.max;
  updateHUD();
}

// ENEMIES
let enemies = [];

function spawnEnemy(){
  let e = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  e.position.set((Math.random()-0.5)*30,0.5,(Math.random()-0.5)*30);
  e.health = 3;
  scene.add(e);
  enemies.push(e);
}

setInterval(spawnEnemy,2000);

// ENEMY AI
function updateEnemies(){
  enemies.forEach(e=>{
    let dx = camera.position.x - e.position.x;
    let dz = camera.position.z - e.position.z;

    e.position.x += dx*0.003;
    e.position.z += dz*0.003;

    if(Math.abs(dx)<1 && Math.abs(dz)<1){
      health -= 0.2;
      updateHUD();
    }
  });
}

// PC MOVEMENT
let keys = {};
document.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);

function move(){
  let speed = 0.1;

  if(keys["w"]) camera.position.z -= speed;
  if(keys["s"]) camera.position.z += speed;
  if(keys["a"]) camera.position.x -= speed;
  if(keys["d"]) camera.position.x += speed;
}

// MOUSE LOOK
document.body.onclick = ()=>document.body.requestPointerLock();

document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement===document.body){
    camera.rotation.y -= e.movementX*0.002;
    camera.rotation.x -= e.movementY*0.002;
  }
});

// MOBILE JOYSTICK
let joystick = document.getElementById("joystick");
let stick = document.getElementById("stick");

let joyX=0, joyY=0;

joystick.addEventListener("touchmove", e=>{
  let rect = joystick.getBoundingClientRect();
  let touch = e.touches[0];

  joyX = (touch.clientX - rect.left - 60)/60;
  joyY = (touch.clientY - rect.top - 60)/60;

  stick.style.left = (joyX*40+35)+"px";
  stick.style.top = (joyY*40+35)+"px";
});

joystick.addEventListener("touchend", ()=>{
  joyX=0; joyY=0;
  stick.style.left="35px";
  stick.style.top="35px";
});

function mobileMove(){
  camera.position.x += joyX*0.1;
  camera.position.z += joyY*0.1;
}

// TOUCH LOOK
let lastX=0;
document.addEventListener("touchmove", e=>{
  let t = e.touches[0];
  let dx = t.clientX - lastX;
  camera.rotation.y -= dx*0.005;
  lastX = t.clientX;
});

// BUTTONS
document.getElementById("shootBtn").onclick = shoot;
document.getElementById("reloadBtn").onclick = reload;
document.getElementById("jumpBtn").onclick = ()=>camera.position.y=2;

// LOOP
function animate(){
  requestAnimationFrame(animate);

  move();
  mobileMove();
  updateEnemies();

  renderer.render(scene,camera);
}

updateHUD();
animate();