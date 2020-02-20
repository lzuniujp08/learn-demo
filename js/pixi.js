let type = "WebGL"
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas"
}

const w = window.innerWidth;
const h = window.innerHeight;
const app = new PIXI.Application({
  width: w,
  height: h,
  antialias: true
});
app.renderer.backgroundColor = 0xffffff;
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

document.body.appendChild(app.view);

drawRandomCircle();

function drawRandomCircle() {
  console.time("控制台计时器一");
  const size = 20;
  const num = 80;
  const sum = size * size * num / 10000;
  console.log(sum);
  const xInterval = w / size;
  const yInterval = h / size;
  for (var i = 0; i < size; i++) {
    const xmin = i * xInterval;
    const xmax = (i + 1) * xInterval;
    for (var j = 0; j < size; j++) {
      const ymin = j * yInterval;
      const ymax = (j + 1) * yInterval;
      // setTimeout(() => {
        for (var k = 0; k < num; k++) {
          const pos = getRandomPosition(xmin, xmax, ymin, ymax);
          drawCicle(2, pos);
        }
      // });
    }
  }
  console.timeEnd("控制台计时器一");
}

function drawCicle(size, position) {
  size = size ? size : 5;
  const circle = new PIXI.Graphics()
  circle.beginFill(0xff33cc);
  circle.drawCircle(0, 0, 5);
  circle.endFill();
  circle.x = position[0];
  circle.y = position[1];
  app.stage.addChild(circle);
}

function getRandomPosition(xmin, xmax, ymin, ymax) {
  const x = randomNum(xmin, xmax);
  const y = randomNum(ymin, ymax);
  return [x, y];
}

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}

/*
// 绘制矩形
const square = new PIXI.Graphics();
square.beginFill(0xffcc33);
square.drawRect(0, 0, 100, 100);
square.endFill();
app.stage.addChild(square);

// 绘制圆
const circle = new PIXI.Graphics()
circle.beginFill(0xff33cc);
circle.drawCircle(0, 0, 5);
circle.endFill();
circle.x = 10;
circle.y = 10;
// circle.position.set(10, 10);
app.stage.addChild(circle);

// 绘制椭圆
let ellipse = new PIXI.Graphics();
ellipse.beginFill(0xFFFF00);
ellipse.drawEllipse(0, 0, 50, 20);
ellipse.endFill();
ellipse.x = 100;
ellipse.y = 50;
app.stage.addChild(ellipse);

// 绘制圆角矩形
let roundBox = new PIXI.Graphics();
roundBox.lineStyle(3, 0x99CCFF, 3);
roundBox.beginFill(0xFF9933);
roundBox.drawRoundedRect(0, 0, 84, 36, 10)
roundBox.endFill();
roundBox.x = 48;
roundBox.y = 190;
app.stage.addChild(roundBox);

// 绘制线
let line = new PIXI.Graphics();
line.lineStyle(4, 0xff0000, 1);
line.moveTo(0, 0);
line.lineTo(80, 50);
line.x = 100;
line.y = 100;
app.stage.addChild(line);

// 绘制多边形
// let path = [
//   point1X, point1Y,
//   point2X, point2Y,
//   point3X, point3Y
// ];
// graphicsObject.drawPolygon(path);
*/
