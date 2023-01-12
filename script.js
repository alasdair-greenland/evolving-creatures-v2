const game = {};

game.creatures = [];
game.predators = [];
game.foods = [];

function onLoad() {

  window.onerror = function(msg, source, line) {
    alert(msg + "\nin " + source + "\non line " + line);
  }
  
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext('2d');

  game.canvas = canvas;
  game.ctx = ctx;

  game.ctx.fillCircle = function(x, y, r) {
    let c = new Path2D(); // this starts the path called c
    c.moveTo(x + r, y); // sets the start point
    c.arc(x, y, r, 0, 2 * Math.PI); // draws an arc around the start point
    this.fill(c); // fills the arc
  }

  for (let i = 0; i < 15; i++) {
    game.creatures.push(new Creature({
      x: 200 * (i % 5) + 150,
      y: 150 * Math.floor(i / 5) + 200,
      speed: 5,
      color1: '#0099ff',
      color2: '#ff0099',
      color3: '#990000',
      generation: 0,
      energy: 100,
      onTick: [ generateFunction(), generateFunction(), generateFunction() ]
    }));
  }
  
  /*
  for (let i = 0; i < 4; i++) {
    game.predators.push(new Predator({
      x: 100 * (i % 3) + 75,
      y: 75 * Math.floor(i / 3) + 150,
      speed: 6,
      color1: '#990011',
      color2: '#117733',
      color3: '#0088ff',
      generation: 0,
      energy: 100,
      onTick: [ p_generateFunction(), p_generateFunction(), p_generateFunction(), p_generateFunction() ]
    }));
  }*/

  for (let i = 0; i < 15; i++) {
    let xRange = 1350 - (foodRadius * 2);
    let yRange = 650 - (foodRadius * 2);

    game.foods.push(new Food(Math.floor(Math.random() * xRange) + foodRadius, Math.floor(Math.random() * 550) + foodRadius));
  }

  mainLoop();
}

const SELF_VARIABLES_LENGTH = 20;

function Creature({x, y, speed, color1, color2, color3, generation, energy, onTick}) {
  this.x = x;
  this.y = y;
  this.color1 = color1;
  this.color2 = color2;
  this.color3 = color3;

  this.breedDelay = 250;

  this.camo = 0;

  this.generation = generation;

  this.speed = speed;
  this.energy = energy;

  this.health = 1000;

  this.distanceMovedThisTick = 0;

  this.alpha = 1.0;

  this.selfGeneratedVariables = new Array(SELF_VARIABLES_LENGTH).fill(0);

  this.onTick = onTick;

  if (this.generation <= 3) {
    this.energy = 7000;
  }

  if (this.generation <= 1) {
    this.energy = 20000;
  }

  this.facing = 0;

  this.drawSelf = function(ctx) {
    ctx.globalAlpha = this.alpha;
    //ctx.globalAlpha /= (1 + this.camo/3);

    if (game.trackedCreature == this) {
      ctx.fillStyle = '#000000';
      ctx.fillCircle(this.x, this.y, 22);
    }
    ctx.fillStyle = this.color1;
    ctx.fillCircle(this.x, this.y, 20);
    ctx.fillStyle = this.color2;
    ctx.fillCircle(this.x, this.y, 12);
    let coords = moveDirection(this.x, this.y, this.facing, 30);
    ctx.fillStyle = this.color3;
    ctx.fillCircle(coords.x, coords.y, 5);
    ctx.globalAlpha = 1.0;
  }

  this.attemptEat = function() {
    for (let i = game.foods.length - 1; i >= 0; i--) {
      if (distance(this.x, this.y, game.foods[i].x, game.foods[i].y) < 35 + foodRadius) {
        game.foods.splice(i, 1);
        this.energy += 1000;
        this.camo = Math.min(4, this.camo);
      }
    }
  }

  this.attemptBreed = function() {
    if (this.breedDelay > 0 || this.energy <= 100) {
      return;
    }
    for (let i = 0; i < game.creatures.length; i++) {
      let c = game.creatures[i];
      if (c != this && c.breedDelay <= 0 && c.energy > 50 && distance(c.x, c.y, this.x, this.y) < 80) {
        c.energy /= 2;
        this.energy /= 2;
        this.breedDelay = 150;
        c.breedDelay = 150;

        let newX = (this.x + c.x) / 2;
        let newY = (this.y + c.y) / 2;
        let newEnergy = this.energy + c.energy;
        let newSpeed = (this.speed + c.speed) / 2 + Math.floor(Math.random() * 5) - 2;
        if (newSpeed >= 20) {
          newSpeed = 20 + (newSpeed - 20) / 2;
        }
        if (newSpeed >= 30) {
          newSpeed = 30;
        }
        let newGen = (Math.max(this.generation, c.generation) + 1);

        let obj = {
          x: newX,
          y: newY,
          energy: newEnergy,
          speed: newSpeed,
          generation: newGen,
          onTick: []
        };

        for (let i = 0; i < 3; i++) {
          let varName = `color${i + 1}`;
          let str = '#';
          for (let j = 0; j < 3; j++) {
            let rand = Math.random();
            if (rand <= 0.48) {
              str += this[varName].substring(j * 2 + 1, j * 2 + 3);
            }
            else if (rand <= 0.96) {
              str += c[varName].substring(j * 2 + 1, j * 2 + 3);
            }
            else {
              str += randomColorCharacter() + randomColorCharacter();
            }
          }
          obj[varName] = str;
        }

        for (let i = 0; i < Math.max(this.onTick.length, c.onTick.length); i++) {
          let rand = Math.random();
          /*
          if ((rand <= 0.49 || i >= c.onTick.length) && i < this.onTick.length) {
            obj.onTick.push(this.onTick[i]);
          }
          else if ((rand <= 0.98 || i >= this.onTick.length) && i < c.onTick.length) {
            obj.onTick.push(c.onTick[i]);
          }
          else {
            obj.onTick.push(generateFunction());
          }
          */
          let newSeed = new Array(100);
          for (let j = 0; j < newSeed.length; j++) {
            if ((rand <= 0.49 || i >= c.onTick.length) && i < this.onTick.length) {
              newSeed[j] = this.onTick[i].seed[j];
            }
            else if ((rand <= 0.98 || i >= this.onTick.length) && i < c.onTick.length) {
              newSeed[j] = c.onTick[i].seed[j];
            }
            else {
              newSeed[j] = Math.floor(Math.random() * 100);
            }
          }
          let func = {
            fn: generateFunction().fn,
            str: generateFunction().str,
            seed: newSeed
          };
          obj.onTick.push(func);
        }
        if (Math.random() < (1 / obj.onTick.length) * 1.25) {
          obj.onTick.push(generateFunction());
        }

        game.creatures.push(new Creature(obj));
      }
    }
  }

  this.canSeeFood = function() {
    for (let i = 0; i < game.foods.length; i++) {
      let f = game.foods[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, f.x, f.y);
      let dist = distance(this.x, this.y, f.x, f.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && dist < this.speed * 100) {
        return dist;
      }
    }
    return false;
  }

  this.canSeeCreature = function() {
    for (let i = 0; i < game.creatures.length; i++) {
      let c = game.creatures[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, c.x, c.y);
      let dist = distance(this.x, this.y, c.x, c.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && c != this && dist < this.speed * 100) {
        return dist;
      }
    }
    return 0;
  }

  this.canSeePredator = function() {
    for (let i = 0; i < game.predators.length; i++) {
      let c = game.predators[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, c.x, c.y);
      let dist = distance(this.x, this.y, c.x, c.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && c != this && dist < this.speed * 100) {
        return dist;
      }
    }
    return 0;
  }

  this.updateSelf = function() {
    for (let i = 0; i < this.onTick.length; i++) {
      this.onTick[i].fn(this, this.onTick[i].seed);
    }
    this.breedDelay -= 1;
    this.energy -= 1;
    if (this.energy <= 0) {
      console.log('dying!');
      this.updateSelf = function() {
        this.breedDelay = 500;
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          game.creatures.splice(game.creatures.indexOf(this), 1);
        }
      }
    }
    if (this.speed <= 1) {
      this.speed = 1;
    }
    if (this.camo > 10) {
      this.camo = 10;
    }
    if (this.distanceMovedThisTick > 3) {
      this.camo = 0;
    }
    this.distanceMovedThisTick = 0;
    if (this.health > 1000) {
      this.health = 1000;
    }
    
    if (this.energy >= 100000) {
      this.energy /= 2;
      let newCreature = this.copy();
      for (let i = 0; i < newCreature.onTick.length; i++) {
        let t = newCreature.onTick[i];
        for (let j = 0; j < t.seed.length; j++) {
          if (Math.random() < 0.07) {
            t.seed[j] = Math.floor(Math.random() * 100);
          }
        }
      }
      game.creatures.push(newCreature);
    }
  }

  this.copy = function() {
    return JSON.parse(JSON.stringify(this));
  }
}

function Predator({x, y, speed, color1, color2, color3, generation, energy, onTick}) {
  this.x = x;
  this.y = y;
  this.color1 = color1;
  this.color2 = color2;
  this.color3 = color3;

  this.breedDelay = 600;

  this.generation = generation;

  this.speed = speed;
  this.energy = energy;

  this.distanceMovedThisTick = 0;

  this.alpha = 1.0;

  this.selfGeneratedVariables = new Array(SELF_VARIABLES_LENGTH).fill(0);

  this.onTick = onTick;

  if (this.generation <= 5) {
    this.energy = 7000;
  }

  if (this.generation <= 2) {
    this.energy = 20000;
  }

  this.facing = 0;

  this.drawSelf = function(ctx) {
    ctx.globalAlpha = this.alpha;
    if (game.trackedCreature == this) {
      ctx.fillStyle = '#000000';
      ctx.fillCircle(this.x, this.y, 32);
    }
    ctx.fillStyle = this.color1;
    ctx.fillCircle(this.x, this.y, 30);
    ctx.fillStyle = this.color2;
    ctx.fillCircle(this.x, this.y, 15);
    let coords = moveDirection(this.x, this.y, this.facing + 10, 30);
    let coords2 = moveDirection(this.x, this.y, this.facing - 10, 30);
    ctx.fillStyle = this.color3;
    ctx.fillCircle(coords.x, coords.y, 5);
    ctx.fillCircle(coords2.x, coords2.y, 5);
    ctx.globalAlpha = 1.0;
  }

  this.attack = function() {
    for (let i = game.creatures.length - 1; i >= 0; i--) {
      if (distance(this.x, this.y, game.creatures[i].x, game.creatures[i].y) < 45 + 35) {
        game.creatures[i].health -= 300;
        if (game.creatures[i].health <= 0) {
          game.creatures.splice(i, 1);
          this.energy += 600;
        }
        else {
          let dir = getDirection(this.x, this.y, game.creatures[i].x, game.creatures[i].y);
          let ncc = moveDirection(game.creatures[i].x, game.creatures[i].y, dir, 50);
          let npc = moveDirection(this.x, this.y, dir, -15);
          game.creatures[i].x = ncc.x;
          game.creatures[i].y = ncc.y;
          this.x = npc.x;
          this.y = npc.y;
          game.creatures[i].camo = Math.min(game.creatures[i].camo, 3);
        }
      }
    }
  }

  this.attemptBreed = function() {
    if (this.breedDelay > 0 || this.energy <= 100) {
      return;
    }
    for (let i = 0; i < game.predators.length; i++) {
      let c = game.predators[i];
      if (c != this && c.breedDelay <= 0 && c.energy > 50 && distance(c.x, c.y, this.x, this.y) < 100) {
        c.energy /= 2;
        this.energy /= 2;
        this.breedDelay = 600;
        c.breedDelay = 600;

        let newX = (this.x + c.x) / 2;
        let newY = (this.y + c.y) / 2;
        let newEnergy = this.energy + c.energy;
        let newSpeed = (this.speed + c.speed) / 2 + Math.floor(Math.random() * 3) - 1;
        if (newSpeed >= 12) {
          newSpeed = 12 + (newSpeed - 12) / 2;
        } 
        if (newSpeed >= 23) {
          newSpeed = 23;
        }
        let newGen = (Math.max(this.generation, c.generation) + 1);

        let obj = {
          x: newX,
          y: newY,
          energy: newEnergy,
          speed: newSpeed,
          generation: newGen,
          onTick: []
        };

        for (let i = 0; i < 3; i++) {
          let varName = `color${i + 1}`;
          let str = '#';
          for (let j = 0; j < 3; j++) {
            let rand = Math.random();
            if (rand <= 0.48) {
              str += this[varName].substring(j * 2 + 1, j * 2 + 3);
            }
            else if (rand <= 0.96) {
              str += c[varName].substring(j * 2 + 1, j * 2 + 3);
            }
            else {
              str += randomColorCharacter() + randomColorCharacter();
            }
          }
          obj[varName] = str;
        }

        for (let i = 0; i < Math.max(this.onTick.length, c.onTick.length); i++) {
          let rand = Math.random();
          /*
          if ((rand <= 0.49 || i >= c.onTick.length) && i < this.onTick.length) {
            obj.onTick.push(this.onTick[i]);
          }
          else if ((rand <= 0.98 || i >= this.onTick.length) && i < c.onTick.length) {
            obj.onTick.push(c.onTick[i]);
          }
          else {
            obj.onTick.push(generateFunction());
          }
          */
          let newSeed = new Array(100);
          for (let j = 0; j < newSeed.length; j++) {
            if ((rand <= 0.49 || i >= c.onTick.length) && i < this.onTick.length) {
              newSeed[j] = this.onTick[i].seed[j];
            }
            else if ((rand <= 0.98 || i >= this.onTick.length) && i < c.onTick.length) {
              newSeed[j] = c.onTick[i].seed[j];
            }
            else {
              newSeed[j] = Math.floor(Math.random() * 100);
            }
          }
          let func = {
            fn: p_generateFunction().fn,
            str: p_generateFunction().str,
            seed: newSeed
          };
          obj.onTick.push(func);
        }
        if (Math.random() < (1 / obj.onTick.length) * 1.25) {
          obj.onTick.push(p_generateFunction());
        }

        game.predators.push(new Predator(obj));
      }
    }
  }

  this.canSeeFood = function() {
    for (let i = 0; i < game.foods.length; i++) {
      let f = game.foods[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, f.x, f.y);
      let dist = distance(this.x, this.y, f.x, f.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && dist < this.speed * 100) {
        return dist;
      }
    }
    return false;
  }

  this.canSeeCreature = function() {
    for (let i = 0; i < game.creatures.length; i++) {
      let c = game.creatures[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, c.x, c.y);
      let dist = distance(this.x, this.y, c.x, c.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && c != this && dist < this.speed * 100) {
        if (c.camo >= 8.25) {
          c.camo -= .5;
          return 0;
        }
        return dist;
      }
    }
    return 0;
  }

  this.canSeePredator = function() {
    for (let i = 0; i < game.predators.length; i++) {
      let c = game.predators[i];
      let dir1 = this.facing;
      let dir2 = getDirection(this.x, this.y, c.x, c.y);
      let dist = distance(this.x, this.y, c.x, c.y);
      let coords1 = moveDirection(this.x, this.y, dir1, dist);
      let coords2 = moveDirection(coords1.x, coords1.y, dir2, -dist);
      if (distance(coords2.x, coords2.y, this.x, this.y) <= dist / 5 && c != this && dist < this.speed * 100) {
        return dist;
      }
    }
    return 0;
  }

  this.updateSelf = function() {
    for (let i = 0; i < this.onTick.length; i++) {
      this.onTick[i].fn(this, this.onTick[i].seed);
    }
    this.breedDelay -= 1;
    this.energy -= 1;
    if (this.energy <= 0) {
      console.log('dying!');
      this.updateSelf = function() {
        this.breedDelay = 700;
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          game.predators.splice(game.predators.indexOf(this), 1);
        }
      }
    }
    if (this.speed <= 1) {
      this.speed = 1;
    }
    this.distanceMovedThisTick = 0;
    
    if (this.energy >= 100000) {
      this.energy /= 2;
      let newCreature = this.copy();
      for (let i = 0; i < newCreature.onTick.length; i++) {
        let t = newCreature.onTick[i];
        for (let j = 0; j < t.seed.length; j++) {
          if (Math.random() < 0.07) {
            t.seed[j] = Math.floor(Math.random() * 100);
          }
        }
      }
      //game.creatures.push(newCreature);
    }
  }

  this.copy = function() {
    return JSON.parse(JSON.stringify(this));
  }
}

function draw(ctx) {
  ctx.fillStyle = '#aaffaa';
  ctx.fillRect(0, 0, 1350, 650);
  for (let i = 0; i < game.foods.length; i++) {
    game.foods[i].drawSelf(ctx);
  }
  for (let i = 0; i < game.predators.length; i++) {
    game.predators[i].drawSelf(ctx);
  }
  for (let i = 0; i < game.creatures.length; i++) {
    game.creatures[i].drawSelf(ctx);
  }

  
  if (game.infoScreenShown) {
    let c = game.infoScreenCreature;
    ctx.fillStyle = '#000000';
    ctx.fillRect(50, 50, 1250, 550);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Roboto';
    ctx.textAlign = 'left';
    ctx.fillText(`x: ${c.x | 0}, y: ${c.y | 0}`, 58, 75);
    ctx.fillText(`facing: ${c.facing | 0}`, 58, 100);
    ctx.fillText(`generation: ${c.generation}`, 58, 125);
    ctx.fillText(`speed: ${c.speed}`, 58, 150);
    ctx.fillText(`energy: ${c.energy}`, 58, 175);
    ctx.fillText(`variables: ${c.selfGeneratedVariables}`, 58, 200);
    ctx.fillText(`camo: ${c.camo}`, 58, 225);
    ctx.fillText('Click anywhere to log this creature\'s onTick code to the console!', 58, 300);
  }
}

const statements = [
  ((s) => {return}),
  ((s) => {return}),
  ((s) => {return}),
  ((s) => {
    s.health += 1;
  }),
  ((s) => {
    s.camo += .25;
  }),
  ((s) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance);
    s.distanceMovedThisTick += distance;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 2);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance / 2);
    s.distanceMovedThisTick += distance / 2;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 4);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s) => {
    s.facing = (s.facing + 5) % 360;
  }),
  ((s) => {
    s.facing = (s.facing - 5 + 360) % 360;
  }),
  ((s) => {
    s.attemptBreed();
  }),
  ((s) => {
    s.attemptEat();
  })
];

const statementsInBooleans = [
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = v;
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] -= 1;
  }),
  ((s, n, v) => {
    s.health += 1;
  }),
  ((s, n, v) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance);
    s.distanceMovedThisTick += distance;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 2);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s, n, v) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance / 2);
    s.distanceMovedThisTick += distance / 2;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 4);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s, n, v) => {
    s.facing = (s.facing + s.selfGeneratedVariables[n]) % 360;
  }),
  ((s, n, v) => {
    s.facing = (s.facing - s.selfGeneratedVariables[n] + 360) % 360;
  }),
  ((s, n, v) => {
    s.attemptBreed();
  }),
  ((s, n, v) => {
    s.attemptEat();
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = s.energy;
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = v * 100;
    if (n == 0) {
      s.selfGeneratedVariables[1] = n * 100;
    }
    else {
      s.selfGeneratedVariables[n - 1] = n * 100;
    }
  })
]

const booleanStatements = [
  ((s, n) => {
    return (s.selfGeneratedVariables[n] <= 0);
  }),
  ((s, n) => {
    return (Math.floor(Math.random() * 10) == 4);
  }),
  ((s, n) => {
    return (s.energy > 500);
  }),
  ((s, n) => {
    return (s.energy < 100);
  }),
  ((s, n) => {
    return (s.energy > s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (Math.random() < 0.7);
  }),
  ((s, n) => {
    return (Math.abs(this.x - (1350/2)) <= 100);
  }),
  ((s, n) => {
    return (Math.abs(this.y - (650 / 2)) <= 75);
  }),
  ((s, n) => {
    return (s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood());
  }),
  ((s, n) => {
    return (s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeePredator() || s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeeCreature() || s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeeCreature() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeeFood() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeePredator() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeeFood() <= s.selfGeneratedVariables[n] || s.canSeeCreature() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.energy >= 2000);
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return false;
  })
]

const dataStatements = [
  ((s) => {
    return Math.floor(Math.abs(s.x - 1350/2) / 25);
  }),
  ((s) => {
    return Math.floor(Math.abs(s.y - 650/2) / 25);
  }),
  ((s) => {
    return Math.floor(Math.random() * 10);
  }),
  ((s) => {
    return Math.floor(Math.min(250, s.energy) / 25);
  }),
  ((s) => {
    return Math.floor(s.breedDelay / 20);
  }),
  ((s) => {
    return Math.floor(s.facing / 12);
  })
]

function generateFunction() {
  let seed = [...new Array(50)].map(() => Math.floor(Math.random() * 100));
  const strList = [
    /*`${statements[seed[0] % statements.length]}`,
    `if (${booleanStatements[seed[0] % booleanStatements.length]}(s, ${seed[2] % 10})) {
      ${statementsInBooleans[seed[1] % statementsInBooleans.length]}(s, ${seed[2] % 10}, Math.min(${dataStatements[seed[3] % dataStatements.length]}(s), 10));
    }
    else {
      ${statements[seed[4] % statements.length]}(s);
    }`,*/
    `if (!${booleanStatements[seed[0] % booleanStatements.length]}(s, ${seed[1] % SELF_VARIABLES_LENGTH})) {
      if (${booleanStatements[seed[2] % booleanStatements.length]}(s, ${seed[3] % SELF_VARIABLES_LENGTH})) {
        ${statementsInBooleans[seed[4] % statementsInBooleans.length]}(s, ${seed[5] % SELF_VARIABLES_LENGTH}, Math.min(${dataStatements[seed[3] % dataStatements.length]}(s), 10));
      }
      else {
        ${statementsInBooleans[seed[6] % statementsInBooleans.length]}(s, ${seed[7] % SELF_VARIABLES_LENGTH}, ${seed[8]});
      }
    }
    else if (${booleanStatements[seed[9] % booleanStatements.length]}(s, ${seed[10] % SELF_VARIABLES_LENGTH})) {
      ${statements[seed[11] % statements.length]}(s));
    }
    else {
      ${statements[seed[12] % statements.length]}(s);
    }`
  ]
  const list = [/*
    function(s, seed) {
      statements[seed[0] % statements.length]()
    },*/
    function(s, seed) {
      if (booleanStatements[seed[0] % booleanStatements.length](s, seed[2] % SELF_VARIABLES_LENGTH)) {
        statementsInBooleans[seed[1] % statementsInBooleans.length]
          (s, seed[2] % SELF_VARIABLES_LENGTH, 
           Math.min(dataStatements[seed[3] % dataStatements.length](s), 10));
        statementsInBooleans[seed[7] % statementsInBooleans.length](s, seed[8] % SELF_VARIABLES_LENGTH, seed[9]);
        statements[seed[6] % statements.length](s);
        if (booleanStatements[seed[10] % booleanStatements.length](s, seed[11] % SELF_VARIABLES_LENGTH)) {
          statementsInBooleans[seed[12] % statementsInBooleans.length](s, seed[11] % SELF_VARIABLES_LENGTH, seed[12]);
        }
        else if (!booleanStatements[seed[13] % booleanStatements.length](s, seed[11] % SELF_VARIABLES_LENGTH)) {
          statements[seed[14] % statements.length](s);
        }
        else {
          statementsInBooleans[seed[15] % statementsInBooleans.length](s, seed[16] % SELF_VARIABLES_LENGTH, Math.min(dataStatements[seed[17] % dataStatements.length](s), 10));
        }
      }
      else {
        if (booleanStatements[seed[17] % booleanStatements.length](s, seed[18] % SELF_VARIABLES_LENGTH)) {
          statements[seed[4] % statements.length](s);
        }
        else {
          statements[seed[19] % statements.length](s);
          statements[seed[20] % statements.length](s);
        }
      }
      statements[seed[5] %  statements.length](s);
    }/*,
    function(s, seed) {
      if (!booleanStatements[seed[0] % booleanStatements.length](s, seed[1] % 10)) {
        if (booleanStatements[seed[2] % booleanStatements.length](s, seed[3] % 10)) {
          statementsInBooleans[seed[4] % statementsInBooleans.length](s, seed[5] % 10, Math.min(dataStatements[seed[3] % dataStatements.length](s), 10));
        }
        else {
          statementsInBooleans[seed[6] % statementsInBooleans.length](s, seed[7] % 10, seed[8]);
        }
      }
      else if (booleanStatements[seed[9] % booleanStatements.length](s, seed[10] % 10)) {
        statements[seed[11] % statements.length](s);
      }
      else {
        statements[seed[12] % statements.length](s);
      }
    }*/
  ]
  return {
    fn: (list[Math.floor(Math.random() * list.length)]),
    str: (strList[Math.floor(Math.random() * strList.length)]),
    seed: seed
  };
}

const p_statements = [
  ((s) => {return}),
  ((s) => {return}),
  ((s) => {return}),
  ((s) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance);
    s.distanceMovedThisTick += distance;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 2);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance / 2);
    s.distanceMovedThisTick += distance / 2;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 4);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s) => {
    s.facing = (s.facing + 5) % 360;
  }),
  ((s) => {
    s.facing = (s.facing - 5 + 360) % 360;
  }),
  ((s) => {
    s.attemptBreed();
  }),
  ((s) => {
    s.attack();
  })
];

const p_statementsInBooleans = [
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = v;
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] -= 1;
  }),
  ((s, n, v) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance);
    s.distanceMovedThisTick += distance;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 2);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s, n, v) => {
    let distance = Math.abs(s.speed - s.distanceMovedThisTick);
    distance = Math.max(distance, 0);
    let coords = moveDirection(s.x, s.y, s.facing, distance / 2);
    s.distanceMovedThisTick += distance / 2;
    s.x = coords.x;
    s.y = coords.y;
    s.energy -= Math.abs(distance / 4);
    s.x = Math.max(Math.min(1330, s.x), 20);
    s.y = Math.max(Math.min(630, s.y), 20);
  }),
  ((s, n, v) => {
    s.facing = (s.facing + s.selfGeneratedVariables[n]) % 360;
  }),
  ((s, n, v) => {
    s.facing = (s.facing - s.selfGeneratedVariables[n] + 360) % 360;
  }),
  ((s, n, v) => {
    s.attemptBreed();
  }),
  ((s, n, v) => {
    s.attack();
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = s.energy;
  }),
  ((s, n, v) => {
    s.selfGeneratedVariables[n] = v * 100;
    if (n == 0) {
      s.selfGeneratedVariables[1] = n * 100;
    }
    else {
      s.selfGeneratedVariables[n - 1] = n * 100;
    }
  })
]

const p_booleanStatements = [
  ((s, n) => {
    return (s.selfGeneratedVariables[n] <= 0);
  }),
  ((s, n) => {
    return (Math.floor(Math.random() * 10) == 4);
  }),
  ((s, n) => {
    return (s.energy > 500);
  }),
  ((s, n) => {
    return (s.energy < 100);
  }),
  ((s, n) => {
    return (s.energy > s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (Math.random() < 0.7);
  }),
  ((s, n) => {
    return (Math.abs(this.x - (1350/2)) <= 100);
  }),
  ((s, n) => {
    return (Math.abs(this.y - (650 / 2)) <= 75);
  }),
  ((s, n) => {
    return (s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood());
  }),
  ((s, n) => {
    return (s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeePredator() || s.canSeeCreature());
  }),
  ((s, n) => {
    return (s.canSeeFood() || s.canSeeCreature() || s.canSeePredator());
  }),
  ((s, n) => {
    return (s.canSeeCreature() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeeFood() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeePredator() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.canSeeFood() <= s.selfGeneratedVariables[n] || s.canSeeCreature() <= s.selfGeneratedVariables[n]);
  }),
  ((s, n) => {
    return (s.energy >= 2000);
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return true;
  }),
  ((s, n) => {
    return false;
  })
]

const p_dataStatements = [
  ((s) => {
    return Math.floor(Math.abs(s.x - 1350/2) / 25);
  }),
  ((s) => {
    return Math.floor(Math.abs(s.y - 650/2) / 25);
  }),
  ((s) => {
    return Math.floor(Math.random() * 10);
  }),
  ((s) => {
    return Math.floor(Math.min(250, s.energy) / 25);
  }),
  ((s) => {
    return Math.floor(s.breedDelay / 20);
  }),
  ((s) => {
    return Math.floor(s.facing / 12);
  })
]

function p_generateFunction() {
  let seed = [...new Array(50)].map(() => Math.floor(Math.random() * 100));
  const strList = [
    /*`${statements[seed[0] % statements.length]}`,
    `if (${booleanStatements[seed[0] % booleanStatements.length]}(s, ${seed[2] % 10})) {
      ${statementsInBooleans[seed[1] % statementsInBooleans.length]}(s, ${seed[2] % 10}, Math.min(${dataStatements[seed[3] % dataStatements.length]}(s), 10));
    }
    else {
      ${statements[seed[4] % statements.length]}(s);
    }`,*/
    `if (!${p_booleanStatements[seed[0] % p_booleanStatements.length]}(s, ${seed[1] % SELF_VARIABLES_LENGTH})) {
      if (${p_booleanStatements[seed[2] % p_booleanStatements.length]}(s, ${seed[3] % SELF_VARIABLES_LENGTH})) {
        ${p_statementsInBooleans[seed[4] % p_statementsInBooleans.length]}(s, ${seed[5] % SELF_VARIABLES_LENGTH}, Math.min(${p_dataStatements[seed[3] % p_dataStatements.length]}(s), 10));
      }
      else {
        ${p_statementsInBooleans[seed[6] % p_statementsInBooleans.length]}(s, ${seed[7] % SELF_VARIABLES_LENGTH}, ${seed[8]});
      }
    }
    else if (${p_booleanStatements[seed[9] % p_booleanStatements.length]}(s, ${seed[10] % SELF_VARIABLES_LENGTH})) {
      ${p_statements[seed[11] % p_statements.length]}(s));
    }
    else {
      ${p_statements[seed[12] % p_statements.length]}(s);
    }`
  ]
  const list = [/*
    function(s, seed) {
      statements[seed[0] % statements.length]()
    },*/
    function(s, seed) {
      if (p_booleanStatements[seed[0] % p_booleanStatements.length](s, seed[2] % SELF_VARIABLES_LENGTH)) {
        p_statementsInBooleans[seed[1] % p_statementsInBooleans.length]
          (s, seed[2] % SELF_VARIABLES_LENGTH, 
           Math.min(p_dataStatements[seed[3] % p_dataStatements.length](s), 10));
        p_statementsInBooleans[seed[7] % p_statementsInBooleans.length](s, seed[8] % SELF_VARIABLES_LENGTH, seed[9]);
        p_statements[seed[6] % p_statements.length](s);
        if (p_booleanStatements[seed[10] % p_booleanStatements.length](s, seed[11] % SELF_VARIABLES_LENGTH)) {
          p_statementsInBooleans[seed[12] % p_statementsInBooleans.length](s, seed[11] % SELF_VARIABLES_LENGTH, seed[12]);
        }
        else if (!p_booleanStatements[seed[13] % p_booleanStatements.length](s, seed[11] % SELF_VARIABLES_LENGTH)) {
          p_statements[seed[14] % p_statements.length](s);
        }
        else {
          p_statementsInBooleans[seed[15] % p_statementsInBooleans.length](s, seed[16] % SELF_VARIABLES_LENGTH, Math.min(p_dataStatements[seed[17] % p_dataStatements.length](s), 10));
        }
      }
      else {
        if (p_booleanStatements[seed[17] % p_booleanStatements.length](s, seed[18] % SELF_VARIABLES_LENGTH)) {
          p_statements[seed[4] % p_statements.length](s);
        }
        else {
          p_statements[seed[19] % p_statements.length](s);
          p_statements[seed[20] % p_statements.length](s);
        }
      }
      p_statements[seed[5] % p_statements.length](s);
    }/*,
    function(s, seed) {
      if (!booleanStatements[seed[0] % booleanStatements.length](s, seed[1] % 10)) {
        if (booleanStatements[seed[2] % booleanStatements.length](s, seed[3] % 10)) {
          statementsInBooleans[seed[4] % statementsInBooleans.length](s, seed[5] % 10, Math.min(dataStatements[seed[3] % dataStatements.length](s), 10));
        }
        else {
          statementsInBooleans[seed[6] % statementsInBooleans.length](s, seed[7] % 10, seed[8]);
        }
      }
      else if (booleanStatements[seed[9] % booleanStatements.length](s, seed[10] % 10)) {
        statements[seed[11] % statements.length](s);
      }
      else {
        statements[seed[12] % statements.length](s);
      }
    }*/
  ]
  return {
    fn: (list[Math.floor(Math.random() * list.length)]),
    str: (strList[Math.floor(Math.random() * strList.length)]),
    seed: seed
  };
}

game.mainLoopQueued = false;
game.mainLoopRunning = false;
game.loopsRun = -1;

game.stop = false;

function mainLoop() {

  if (game.stop) {
    return;
  }

  game.loopsRun++;

  game.mainLoopQueued = true;
  game.mainLoopRunning = true;
  setTimeout(() => {
    game.mainLoopQueued = false;
    if (game.mainLoopRunning || game.stop) {
      return;
    }
    mainLoop();
  }, 1000 / 20);

  /*
  if (game.loopsRun == 20 * 60 * 5) {
    for (let i = 0; i < 2; i++) {
      game.predators.push(new Predator({
        x: 100 * (i % 3) + 75,
        y: 75 * Math.floor(i / 3) + 150,
        speed: 6,
        color1: '#990011',
        color2: '#117733',
        color3: '#0088ff',
        generation: 0,
        energy: 100,
        onTick: [ p_generateFunction(), p_generateFunction(), p_generateFunction(), p_generateFunction() ]
      }));
    }
  }*/

  for (let i = 0; i < game.creatures.length; i++) {
    game.creatures[i].updateSelf();
  }

  for (let i = 0; i < game.predators.length; i++) {
    game.predators[i].updateSelf();
  }

  let xRange = 1350 - (foodRadius * 2);
  let yRange = 650 - (foodRadius * 2);

  if (Math.random() < 0.07) {
    game.foods.push(new Food(Math.floor(Math.random() * xRange) + foodRadius, Math.floor(Math.random() * yRange) + foodRadius));
  }
  
  draw(game.ctx);

  if (game.creatures.length == 1) {
    let c = game.creatures[0];
    let c2 = new Creature({
      x: c.x,
      y: c.y,
      speed: 5,
      color1: '#0099ff',
      color2: '#ff0099',
      color3: '#990000',
      generation: c.generation,
      energy: 1000,
      onTick: [ generateFunction(), generateFunction(), generateFunction() ]
    });
    c2.breedDelay = 0;
    game.creatures.push(c2);
    c.attemptBreed();
  }

  if (game.predators.length == 1) {
    let c = game.predators[0];
    let c2 = new Predator({
      x: c.x,
      y: c.y,
      speed: 6,
      color1: '#990011',
      color2: '#117733',
      color3: '#0088ff',
      generation: 0,
      energy: 100,
      onTick: [ p_generateFunction(), p_generateFunction(), p_generateFunction(), p_generateFunction() ]
    });
    c2.breedDelay = 0;
    game.predators.push(c2);
    c.attemptBreed();
  }

  game.mainLoopRunning = false;
  if (!game.mainLoopQueued && !game.stop) {
    mainLoop();
  }
}

const foodRadius = 20;

function Food(x, y) {
  this.x = x;
  this.y = y;
  this.r = foodRadius;

  this.drawSelf = function(ctx) {
    ctx.fillStyle = '#009955';
    ctx.fillCircle(this.x, this.y, this.r);
  }
}

game.infoScreenShown = false;
game.infoScreenCreature = null;
game.trackedCreature = null;


window.onkeydown = function(evt) {
  if (evt.keyCode == 32) {
    game.stop = !game.stop;
    if (!game.stop) {
      mainLoop();
      game.infoScreenShown = false;
    }
    else {
      let ctx = game.ctx;
      ctx.fillStyle = '#ffffff';
      ctx.font = '100px Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 1350/2, 200);
    }
  }
  else if (evt.keyCode == 27) {
    game.infoScreenShown = false;
    draw(game.ctx);
  }
  else if (evt.keyCode == 84) {
    if (game.infoScreenShown) {
      if (game.trackedCreature == game.infoScreenCreature) {
        game.trackedCreature = null;
      }
      else {
        game.trackedCreature = game.infoScreenCreature;
      }
    }
  }
  else if (evt.keyCode == 68) {
    if (game.infoScreenShown) {
      game.creatures.push(new Creature({
        x: game.infoScreenCreature.x,
        y: game.infoScreenCreature.y,
        speed: 5,
        color1: '#0099ff',
        color2: '#ff0099',
        color3: '#990000',
        generation: 0,
        energy: 100,
        onTick: [ generateFunction(), generateFunction(), generateFunction() ]
      }));
      game.infoScreenCreature.attemptBreed();
    }
  }
  else if (evt.keyCode == 220) {
    if (game.stop) {
      window.alert(JSON.stringify(game));
    }
  }
  else if (evt.keyCode == 221) {
    if (game.stop) {
      game = JSON.parse(window.prompt("paste game state")) || game;
    }
  }
}

game.mouseX = -1;
game.mouseY = -1;

window.onmousemove = function() {
  let rect = game.canvas.getBoundingClientRect();
  game.mouseX = event.clientX - rect.left - 1;
  game.mouseY = event.clientY - rect.top - 1;
}

window.onmousedown = function() {
  if (!game.stop) {
    return;
  }
  if (game.infoScreenShown) {
    for (let i = 0; i < game.infoScreenCreature.onTick.length; i++) {
      //console.log(i + ': ' + game.infoScreenCreature.onTick[i].str);
    }
    return;
  }
  for (let i = 0; i < game.creatures.length; i++) {
    if (distance(game.mouseX, game.mouseY, game.creatures[i].x, game.creatures[i].y) <= 40) {
      game.infoScreenShown = true;
      game.infoScreenCreature = game.creatures[i];
      draw(game.ctx);
    }
  }
}