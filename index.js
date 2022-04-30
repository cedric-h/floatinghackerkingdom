import vec, * as v2 from "./vec2.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

(window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})();

// const { channels: names, data: proximities } =
//   await fetch("matrix.json").then(x => x.json());
let names = [...Array(500)].map(x =>
  [...Array(3)]
    .map(() => Math.floor(Math.random() * 256))
);
const maxd = Math.sqrt(255*255 + 255*255 + 255*255);
const proximities = names.map(r => names.map(c => {
  const [rd, gd, bd] = r.map((rx, i) => rx - c[i]);
  return Math.sqrt(rd*rd + gd*gd + bd*bd) / maxd;
}));
const points = v2.circle(proximities.length)
  .map((x, i) => ({ i, pos: v2.mulf(x, Math.random() * 500) }));

const mouse = { x: 0, y: 0 };
window.onmousemove = ev => (mouse.x = ev.pageX -  canvas.width/2,
                            mouse.y = ev.pageY - canvas.height/2);

let mousedown = false;
window.onmousedown = ev => mousedown = true;
window.onmouseup = ev => mousedown = false;

let search = "ced";
window.onkeydown = e => {
  if (e.key == "f")
    search = prompt("search?", search);
}

// const onlycare = points
//   .map(p => [...points]
//     .sort((a, b) => proximities[p.i][a.i] - proximities[p.i][b.i])
//     .slice(0, 10))

requestAnimationFrame(function frame(now) {
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);

  for (let i = 0; i < 5; i++) {
  ctx.fillStyle = "darkblue";
  for (const point of points) {
    const { i, pos } = point;

    const SCALE = 750;

    const hover = Math.abs(pos.x - mouse.x) < 5 &&
                  Math.abs(pos.y - mouse.y) < 5;

    // if (hover && mousedown)
    //   console.log(names[i]);
    // ctx.fillStyle = hover ? "crimson" : "darkblue";
    // if (names[i].startsWith(search)) ctx.fillStyle = "magenta";
    const [r, g, b] = names[i];
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    const { max, min, abs, sign } = Math;

    const realprox = other => max(0, min(1, v2.dist(other.pos, pos) / SCALE));
    const goalprox = other => proximities[i][other.i];
    const deltaprox = other => realprox(other) - goalprox(other)

    for (const other of points) if (other != point) {
      let d = v2.norm(v2.sub(other.pos, pos));
      point.pos = v2.add(pos, v2.mulf(d, deltaprox(other) * 5));
    }

    const { x, y } = pos;
    ctx.globalAlpha = 1;
    ctx.fillRect(x-5, y-5, 10, 10);
    ctx.globalAlpha = 0.1;
    ctx.fillRect(x-15, y-15, 30, 30);
    ctx.globalAlpha = 0.03;
    ctx.fillRect(x-50, y-50, 100, 100);
  }
  }

  ctx.restore();

  requestAnimationFrame(frame);
});
