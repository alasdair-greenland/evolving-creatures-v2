function getDirection(x, y, x1, y1) {
  var opp = x1 - x;
  var adj = y1 - y;
  var deg = toDegrees(Math.atan2(adj, opp));
  //sendMessage('Opp: ' + opp + ', adj: ' + adj + ', direction: ' + deg);
  return(deg);
  if (opp == 0) {
    if (adj > 0) {
      return 90;
    }
    else {
      return 270;
    }
  }
  else if (adj == 0) {
    if (opp > 0) {
      return 0;
    }
    else {
      return 180;
    }
  }
  else {
    return(toDegrees(Math.atan(adj / opp))) + 180;
  }
}

function moveDirection(x, y, angle, distance) {
  var movex = Math.cos(toRadians(angle)) * distance;
  var movey = Math.sin(toRadians(angle)) * distance;
  var rx = x + movex;
  var ry = y + movey;
  return {
    x: rx,
    y: ry
  };
}

function toRadians(angle) {
  return (angle / 180) * Math.PI;
}

function toDegrees(angle) {
  return (angle / Math.PI) * 180;
}

function distance(x, y, x2, y2) {
  return Math.sqrt(((x - x2) * (x - x2)) + ((y - y2) * (y - y2)));
}

function randomColorCharacter() {
  let lst = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' ];
  return (lst[Math.floor(Math.random() * lst.length)]);
}