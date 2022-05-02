import vec, * as v2 from "./vec2.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

(window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})();

const { channels: names, data: proximities } =
  await fetch("matrix.json").then(x => x.json());


const nodes = new Set(Object.keys(proximities));

const points = [];
let firstIndex;
do {
  firstIndex = names.indexOf(prompt("channel name!", "matthews-brain-dump"));
} while (firstIndex == -1);

const edge = [{ i: firstIndex, pos: vec(), stack: [] }];
while (edge.length) {
  const par = edge.shift();
  if (!nodes.delete(''+par.i)) continue;
  points.push(par);

  const prox = i => proximities[par.i][i];
  const close = [...nodes]
    .sort((a, b) => prox(b) - prox(a))
    .slice(0, 3 - par.stack.length);

  const stack = [par.i, ...par.stack];

  const offset = Math.random() * Math.PI * 2;
  for (const [closeI, p] of Object.entries(v2.circle(close.length, offset))) {
    const i = close[closeI];
    const dist = canvas.width/15 * proximities[par.i][i]
    const pos = v2.add(par.pos, v2.mulf(p, dist));
    edge.push({ i, pos, stack });
  }
}

let search = "ced";
window.onkeydown = e => {
  if (e.key == "f")
    search = prompt("search?", search);
}

// const onlycare = points
//   .map(p => [...points]
//     .sort((a, b) => proximities[p.i][a.i] - proximities[p.i][b.i])
//     .slice(0, 10));

let scale = 1;
document.querySelector("canvas").onwheel = ev => {
  scale = Math.max(0, scale + event.deltaY * -0.01);
  ev.preventDefault();
}

let mousedown = false;
window.onmousedown = ev => mousedown = true;
window.onmouseup = ev => mousedown = false;

let cam = v2.divf(points.map(x => x.pos).reduce(v2.add, vec()), -points.length);
const mouse = vec();
window.onmousemove = ev => {
  if (!mousedown) {
    mouse.x = (ev.pageX -  canvas.width/2) / scale;
    mouse.y = (ev.pageY - canvas.height/2) / scale;
  } else {
    cam.x += ev.movementX;
    cam.y += ev.movementY;
  }
}

requestAnimationFrame(function frame(now) {
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(cam.x + canvas.width/2, cam.y + canvas.height/2);
  ctx.scale(scale, scale)

  const SCALE = 700;
  for (const point of points) {
    const { pos, i } = point;
    const { max, min, abs, sign } = Math;

    const realprox = other => max(0, min(1, v2.dist(other.pos, pos) / SCALE));
    const goalprox = other => proximities[i][other.i];
    const deltaprox = other => realprox(other) - goalprox(other)

    let dpa = 0;
    for (let i = 0; i < 5; i++) {
      for (const other of points) if (other != point) {
        dpa += abs(deltaprox(other));

        let d = v2.norm(v2.sub(other.pos, pos));
        point.pos = v2.add(pos, v2.mulf(d, 2*deltaprox(other)));
      }
    }
  }

  ctx.textBaseline = "middle";
  const text = [];
  const finalPos = ({ x, y }) => {
    const w = (canvas.width - 10)/scale,
          h = (canvas.height - 10)/scale;
    x = Math.min(w/ 2 - cam.x/scale, x);
    x = Math.max(w/-2 - cam.x/scale, x);
    y = Math.min(h/ 2 - cam.y/scale, y);
    y = Math.max(h/-2 - cam.y/scale, y);
    return { x, y };
  }

  let hovered;
  for (const point of points) {
    let size = 20/scale;

    const { x, y } = finalPos(point.pos);
    const hover = Math.abs(cam.x / scale + x - mouse.x) < size/2 &&
                  Math.abs(cam.y / scale + y - mouse.y) < size/2;
    if (hover)
      hovered = point;
  }

  for (const point of points) {
    const { i, pos, stack } = point;

    let { x, y } = finalPos(pos);

    let size = 20/scale;
    const searched = names[i].startsWith(search);

    let boxsize = 40/scale;
    if (point == hovered || searched || (hovered && hovered.stack.includes(i)))
      text.push({
        color: searched ? "magenta" : "darkblue",
        pos: { x, y: y - 30/scale },
        chars: names[i]
      });

    ctx.font = `${30/scale}px sans-serif`;
    ctx.fillText("☁️", x-30/scale/2, y+size/2);
    ctx.font = `${size}px sans-serif`;
    ctx.fillText("🏰", x-size/2, y);
  }

  if (hovered) {
    ctx.beginPath();
    ctx.moveTo(hovered.pos.x, hovered.pos.y);
    for (const xi of hovered.stack) {
      const { x, y } = points.find(x => x.i == xi).pos;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (const { color, pos, chars } of text) {
    ctx.fillStyle = color;
    ctx.font = `${30/scale}px serif`;
    const { width } = ctx.measureText(chars);
    ctx.fillText(chars, pos.x+width/-2, pos.y);
  }

  ctx.restore();

  requestAnimationFrame(frame);
});
