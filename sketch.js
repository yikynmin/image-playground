let sourceImg = null;
let sourceName = "image-playground";

let cols = 130;

let minDot = 9;
let maxDot = 9;
const SIZE_POWER = 1.5;

let shapeMode = "circle";

let gridStep = 1;
let moveSpeed = 0.10;
let moveVariation = 0.04;
let direction = -1;

let baseHue = 0;
let accentHue = 180;

let dots = [];
let mode = "pixelize";

let pInst = null;

const q = id => document.getElementById(id);

function randomizePalette() {
  if (!pInst) return;

  baseHue = pInst.random(360);

  accentHue =
    (
      baseHue +
      pInst.random(145, 215)
    ) % 360;
}

function handleUpload(file) {
  if (!file || !pInst) return;

  sourceName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-");

  const reader = new FileReader();

  reader.onload = e => {
    pInst.loadImage(
      e.target.result,

      img => {
        sourceImg = img;
        sourceImg.loadPixels();

        resizeCanvasToImage();
        randomizePalette();
        rebuildDots();
      },

      err => {
        console.error("Image load failed:", err);
        alert("Could not load this image. Try JPG, PNG, or WebP.");
      }
    );
  };

  reader.readAsDataURL(file);
}

function resizeCanvasToImage() {
  if (!sourceImg || !pInst) return;

  const stageWidth =
    Math.max(
      320,
      Math.min(
        1100,
        window.innerWidth - 320
      )
    );

  const aspect =
    sourceImg.height /
    sourceImg.width;

  pInst.resizeCanvas(
    stageWidth,
    Math.max(
      1,
      Math.round(
        stageWidth * aspect
      )
    )
  );
}

function rebuildDots() {
  if (!sourceImg || !pInst) return;

  dots = [];

  const aspect =
    sourceImg.height /
    sourceImg.width;

  const rows =
    Math.max(
      1,
      Math.round(
        cols * aspect
      )
    );

  const cellW =
    pInst.width /
    cols;

  const cellH =
    pInst.height /
    rows;

  sourceImg.loadPixels();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

      const sx =
        Math.floor(
          pInst.map(
            x,
            0,
            Math.max(1, cols - 1),
            0,
            sourceImg.width - 1
          )
        );

      const sy =
        Math.floor(
          pInst.map(
            y,
            0,
            Math.max(1, rows - 1),
            0,
            sourceImg.height - 1
          )
        );

      const i =
        (sx + sy * sourceImg.width) * 4;

      const r =
        sourceImg.pixels[i];

      const g =
        sourceImg.pixels[i + 1];

      const b =
        sourceImg.pixels[i + 2];

      const normalized =
        (((r + g + b) / 3) / 255);

      let tone =
        Math.floor(
          normalized * 5
        );

      tone =
        Math.max(
          0,
          Math.min(
            4,
            tone
          )
        );

      let hue;
      let saturation;
      let lightness;

      if (tone === 4) {
        hue = baseHue;
        saturation = 8;
        lightness = 99;
      }

      else if (tone === 2) {
        hue = accentHue;
        saturation = 100;
        lightness = 60;
      }

      else {
        hue = baseHue;

        const satValues =
          [100, 100, 96, 90];

        const lightValues =
          [28, 39, 52, 70];

        saturation =
          satValues[tone];

        lightness =
          lightValues[tone];
      }

      const darkness =
        1 - normalized;

      const sizeFactor =
        Math.pow(
          darkness,
          SIZE_POWER
        );

      const size =
        minDot +
        (maxDot - minDot) *
        sizeFactor;

      dots.push({
        x:
          x * cellW +
          cellW / 2,

        y:
          y * cellH +
          cellH / 2,

        size,

        hue,
        saturation,
        lightness,

        cellW,

        speed:
          Math.max(
            0.001,
            moveSpeed +
            pInst.random(
              -moveVariation,
              moveVariation
            )
          ),

        offset:
          pInst.random(
            -cellW * gridStep,
            0
          )
      });
    }
  }
}

function updateSpeeds() {
  if (!pInst) return;

  dots.forEach(d => {
    d.speed =
      Math.max(
        0.001,
        moveSpeed +
        pInst.random(
          -moveVariation,
          moveVariation
        )
      );
  });
}

function drawHeart(p, x, y, size) {
  p.push();
  p.translate(x, y);

  const scale =
    size / 34;

  p.scale(
    scale,
    scale
  );

  p.beginShape();

  for (
    let t = 0;
    t <= p.TWO_PI + 0.08;
    t += 0.08
  ) {
    const hx =
      16 *
      Math.pow(
        Math.sin(t),
        3
      );

    const hy =
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );

    p.vertex(
      hx,
      hy
    );
  }

  p.endShape(
    p.CLOSE
  );

  p.pop();
}

function drawDot(p, d, x, y) {
  const night =
    document.body.classList.contains(
      "night"
    );

  let s =
    d.saturation;

  let l =
    d.lightness;

  if (night) {
    if (l >= 96) {
      s = 0;
      l = 7;
    }

    else {
      s =
        Math.min(
          100,
          s + 4
        );

      l =
        Math.min(
          76,
          l + 6
        );
    }
  }

  p.fill(
    d.hue,
    s,
    l
  );

  if (shapeMode === "heart") {
    drawHeart(
      p,
      x,
      y,
      d.size
    );
  }

  else {
    p.circle(
      x,
      y,
      d.size
    );
  }
}

new p5(p => {

  p.setup = () => {
    const canvas =
      p.createCanvas(
        800,
        500
      );

    canvas.parent(
      "canvasWrap"
    );

    pInst = p;

    p.pixelDensity(1);

    p.colorMode(
      p.HSL,
      360,
      100,
      100
    );

    p.noStroke();

    randomizePalette();
  };


  p.draw = () => {
    p.background(
      document.body.classList.contains(
        "night"
      )
        ? 0
        : 100
    );

    if (!sourceImg) return;

    dots.forEach(d => {

      let x =
        d.x;

      if (mode === "move") {

        const moveDistance =
          d.cellW *
          gridStep;

        d.offset +=
          d.speed *
          direction;

        if (
          direction === -1 &&
          d.offset <
          -moveDistance
        ) {
          d.offset = 0;
        }

        if (
          direction === 1 &&
          d.offset >
          moveDistance
        ) {
          d.offset = 0;
        }

        x +=
          d.offset;
      }

      drawDot(
        p,
        d,
        x,
        d.y
      );
    });
  };


  p.windowResized = () => {
    if (sourceImg) {
      resizeCanvasToImage();
      rebuildDots();
    }
  };
});


// IMAGE
q("imageInput").addEventListener(
  "change",
  e => {
    handleUpload(
      e.target.files[0]
    );
  }
);


// PIXEL COUNT
q("pixelCount").addEventListener(
  "input",
  e => {
    cols =
      Number(
        e.target.value
      );

    q("pixelCountValue").textContent =
      cols;

    if (sourceImg) {
      rebuildDots();
    }
  }
);


// MIN DOT
q("minDot").addEventListener(
  "input",
  e => {
    minDot =
      Number(
        e.target.value
      );

    if (minDot > maxDot) {
      maxDot = minDot;
      q("maxDot").value = maxDot;
      q("maxDotValue").textContent = maxDot;
    }

    q("minDotValue").textContent =
      minDot;

    if (sourceImg) {
      rebuildDots();
    }
  }
);


// MAX DOT
q("maxDot").addEventListener(
  "input",
  e => {
    maxDot =
      Number(
        e.target.value
      );

    if (maxDot < minDot) {
      minDot = maxDot;
      q("minDot").value = minDot;
      q("minDotValue").textContent = minDot;
    }

    q("maxDotValue").textContent =
      maxDot;

    if (sourceImg) {
      rebuildDots();
    }
  }
);


// SHAPE
q("circleBtn").addEventListener(
  "click",
  () => {
    shapeMode = "circle";

    q("circleBtn").classList.add(
      "selected"
    );

    q("heartBtn").classList.remove(
      "selected"
    );
  }
);

q("heartBtn").addEventListener(
  "click",
  () => {
    shapeMode = "heart";

    q("heartBtn").classList.add(
      "selected"
    );

    q("circleBtn").classList.remove(
      "selected"
    );
  }
);


// COLOR
q("randomColor").addEventListener(
  "click",
  () => {
    randomizePalette();

    if (sourceImg) {
      rebuildDots();
    }
  }
);


// MOVE
q("gridStep").addEventListener(
  "input",
  e => {
    gridStep =
      Number(
        e.target.value
      );

    q("gridStepValue").textContent =
      gridStep;
  }
);

q("moveSpeed").addEventListener(
  "input",
  e => {
    moveSpeed =
      Number(
        e.target.value
      );

    q("moveSpeedValue").textContent =
      moveSpeed.toFixed(2);

    updateSpeeds();
  }
);

q("variation").addEventListener(
  "input",
  e => {
    moveVariation =
      Number(
        e.target.value
      );

    q("variationValue").textContent =
      moveVariation.toFixed(2);

    updateSpeeds();
  }
);

q("leftBtn").addEventListener(
  "click",
  () => {
    direction = -1;

    q("leftBtn").classList.add(
      "selected"
    );

    q("rightBtn").classList.remove(
      "selected"
    );
  }
);

q("rightBtn").addEventListener(
  "click",
  () => {
    direction = 1;

    q("rightBtn").classList.add(
      "selected"
    );

    q("leftBtn").classList.remove(
      "selected"
    );
  }
);


// PANELS
document
  .querySelectorAll(
    ".section-tab"
  )
  .forEach(
    btn => {
      btn.addEventListener(
        "click",
        () => {
          mode =
            btn.dataset.panel;

          document
            .querySelectorAll(
              ".section-tab"
            )
            .forEach(
              b => {
                b.classList.toggle(
                  "active",
                  b === btn
                );
              }
            );

          q("pixelizePanel")
            .classList.toggle(
              "active",
              mode === "pixelize"
            );

          q("movePanel")
            .classList.toggle(
              "active",
              mode === "move"
            );

          q("introPanel")
            .classList.remove(
              "open"
            );
        }
      );
    }
  );


// INTRO
q("introBtn").addEventListener(
  "click",
  () => {
    q("introPanel")
      .classList.toggle(
        "open"
      );
  }
);

q("homeBtn").addEventListener(
  "click",
  () => {
    q("introPanel")
      .classList.remove(
        "open"
      );
  }
);


// THEME
q("themeBtn").addEventListener(
  "click",
  e => {
    document.body.classList.toggle(
      "night"
    );

    e.currentTarget.textContent =
      document.body.classList.contains(
        "night"
      )
        ? "DAY"
        : "NIGHT";
  }
);


// SAVE PNG
function saveCurrentImage(suffix) {
  if (!sourceImg || !pInst) return;

  pInst.saveCanvas(
    sourceName + suffix,
    "png"
  );
}

q("saveImage").addEventListener(
  "click",
  () => {
    saveCurrentImage(
      "-pixelized"
    );
  }
);

q("saveImageMove").addEventListener(
  "click",
  () => {
    saveCurrentImage(
      "-moving"
    );
  }
);


// SAVE GIF
q("saveGif").addEventListener(
  "click",
  () => {
    if (!sourceImg || !pInst) return;

    mode = "move";

    pInst.saveGif(
      sourceName + "-moving",
      3
    );
  }
);
