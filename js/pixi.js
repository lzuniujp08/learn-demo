let type = "canvas"
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
  const num = 20;
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
      setTimeout(() => {
        for (var k = 0; k < num; k++) {
          const pos = getRandomPosition(xmin, xmax, ymin, ymax);
          drawCicle(5, pos);
        }
      });
    }
  }
  console.timeEnd("控制台计时器一");
}

function drawCicle(size, position) {
  size = size ? size : 5;
  const circle = new PIXI.Graphics()
  circle.beginFill(0xff33cc, 0.3);
  circle.drawCircle(0, 0, size);
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

// 绘制图片
// name (string): 加载源文件的别名,如果没设置，url就会被放在这.
// url (string): 源文件的地址，是加载器 baseUrl的相对地址.
// options (object literal): 加载设置.
// options.crossOrigin (Boolean): 源文件请求跨域不？默认是自动设定的。
// options.loadType: 源文件是怎么加载进来的？默认是Resource.LOAD_TYPE.XHR。
// options.xhrType: 用XHR的时候该怎么处理数据？ 默认是Resource.XHR_RESPONSE_TYPE.DEFAULT。
// callbackFunction: 当这个特定的函数加载完，这个特定的函数将会被执行。
// PIXI.loader
//   .add('logo', '../css/09.png')
//   .on("progress", loadProgressHandler)
//   .load(loaded);

function loadProgressHandler(loader, resource) {
  console.log(loader);
  console.log(resource);
}
var img = null,
  _img = null,
  state;

function loaded(loader, resource) {
  for (var res in resource) {
    const texture = resource[res].texture;
    // 裁剪图片
    let rectangle = new PIXI.Rectangle(96, 64, 32, 32);
    texture.frame = rectangle;

    img = new PIXI.Sprite(texture);
    img.vx = 0;
    img.vy = 0;

    //设置位置
    img.position.set(16, 16);

    // 设置大小
    // img.width = 200;
    // img.height = 120;

    // 设置缩放
    // img.scale.set(1.5, 1.5);

    // 设置旋转
    // img.rotation = Math.PI / 4;

    // 设置锚点
    img.anchor.set(0.5, 0.5);
    // img.pivot.set(200, 200);

    //设置可见性
    // img.visible = false;

    _img = new PIXI.Sprite(texture);
    _img.position.set(50, 50);
    app.stage.addChild(img, _img);

    // 开始动画
    // gameLoop();
    // app.ticker.add(() => gameTicker());

    // 添加鼠标事件
    addKeyboardEvt();
    state = play;
    app.ticker.add(delta => gameStart(delta));

  }
}
// 添加键盘操作
function addKeyboardEvt() {
  let left = keyboard(37),
    up = keyboard(38),
    right = keyboard(39),
    down = keyboard(40);
  let off = 1;

  left.press = () => {
    img.rotation = Math.PI;
    img.vx = -off;
    img.vy = 0;
  };
  left.release = () => {
    if (!right.isDown && img.vy === 0) {
      img.vx = 0;
    }
  };

  up.press = () => {
    img.rotation = -(Math.PI / 2);
    img.vy = -off;
    img.vx = 0;
  };
  up.release = () => {
    if (!down.isDown && img.vx === 0) {
      img.vy = 0;
    }
  };

  right.press = () => {
    img.rotation = 0;
    img.vx = off;
    img.vy = 0;
  };
  right.release = () => {
    if (!left.isDown && img.vy === 0) {
      img.vx = 0;
    }
  };

  down.press = () => {
    img.rotation = Math.PI / 2;
    img.vy = off;
    img.vx = 0;
  };
  down.release = () => {
    if (!up.isDown && img.vx === 0) {
      img.vy = 0;
    }
  };
}

function play(delta) {
  img.x += img.vx;
  img.y += img.vy
  if (hitTestRectangle(img, _img)) {
    console.log('hit me');
  }
}

function hitTestRectangle(r1, r2) {
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
  hit = false;
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;
  if (Math.abs(vx) < combinedHalfWidths) {
    if (Math.abs(vy) < combinedHalfHeights) {
      hit = true;
    } else {
      hit = false;
    }
  } else {
    hit = false;
  }
  return hit;
};

function gameStart(delta) {
  state(delta);
}

function keyboard(keyCode) {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  key.downHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };
  key.upHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  img.x += 1;
  img.y += 1;
  if (img.x > 500) {
    img.position.set(16, 16);
  }
}

function gameTicker() {
  img.vx = 2;
  img.vy = 1;
  img.position.set(img.x + img.vx, img.x + img.vx);
  if (img.x > 500) {
    img.position.set(16, 16);
  }
}

/*
// 绘制文字
var style = {
	fontFamily: 'Arial',
	fontSize: '36px',
	fontStyle: 'italic',
	fontWeight: 'bold',
	fill: '#F7EDCA',
	stroke: '#4a1850',
	strokeThickness: 5,
	dropShadow: true,
	dropShadowColor: '#000000',
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
	wordWrap: false, //是否允许换行
	wordWrapWidth: 440 //换行执行宽度
};
const message = new PIXI.Text(
  "Hello Pixi!",
  style
);
message.position.set(54, 96);
app.stage.addChild(message);

// 绘制矩形
const square = new PIXI.Graphics();
square.beginFill(0xffcc33);
square.drawRect(0, 0, 100, 100);
square.endFill();
app.stage.addChild(square);

// 绘制圆
const circle = new PIXI.Graphics();
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
