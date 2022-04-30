import vec, * as v2 from "./vec2.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

(window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})();

const { channels: names, data: proximities } =
  await fetch("matrix.json").then(x => x.json());

const points = v2.circle(proximities.length)
  .map((x, i) => ({ i, pos: v2.mulf(x, Math.random()*500) }));

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

let cam = vec();
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

  let dpas = new Array(points.length);
  for (const point of points) {
    const { i, pos } = point;

    const SCALE = 1000;

    const { max, min, abs, sign } = Math;

    const realprox = other => max(0, min(1, v2.dist(other.pos, pos) / SCALE));
    const goalprox = other => proximities[i][other.i];
    const deltaprox = other => realprox(other) - goalprox(other)

    let dpa = 0;
    for (let i = 0; i < 5; i++) {
      for (const other of points) if (other != point) {
        dpa += abs(deltaprox(other));

        let d = v2.norm(v2.sub(other.pos, pos));
        point.pos = v2.add(pos, v2.mulf(d, 5 + deltaprox(other) * 250));
      }
    }
    dpa /= (points.length - 1);
    dpa /= 5;
    dpas[i] = dpa;
  }

  const dpaMin = Math.min(...dpas);
  const dpaMax = Math.max(...dpas);
  for (const point of points) {
    const { i, pos } = point;

    let size = 10/scale;
    const hover = Math.abs(cam.x / scale + pos.x - mouse.x) < size/2 &&
                  Math.abs(cam.y / scale + pos.y - mouse.y) < size/2;

    const scaledDpa = (dpas[i] - dpaMin) / dpaMax;
    ctx.fillStyle = `rgb(0, ${scaledDpa * 255}, 0)`;
    if (hover && mousedown)
      console.log(names[i]);
    if (hover)
      ctx.fillStyle = "crimson";
    if (names[i].startsWith(search))
      ctx.fillStyle = "magenta";

    const { x, y } = pos;
    ctx.fillRect(x-size/2, y-size/2, size, size);
  }

  ctx.restore();

  requestAnimationFrame(frame);
});
