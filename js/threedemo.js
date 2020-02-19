console.log(WEBGL.isWebGLAvailable() ? 'webgl可用' : 'webgl不可用');
// 创建场景
var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
// 创建摄像机
// var camera = new THREE.PerspectiveCamera(
//   100,
//   width / height,
//   0.1,
//   1000
// );
var camera = new THREE.PerspectiveCamera(
  45, width / height,
  1,
  500
);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

// 创建渲染
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

createLine();
// createAnimateCube();

// 添加线
function createLine() {
  var material = new THREE.LineBasicMaterial({
    color: 'blue'
  });
  var points = [];
  points.push(new THREE.Vector3(-10, 0, 0));
  points.push(new THREE.Vector3(0, 10, 0));
  points.push(new THREE.Vector3(10, 0, 0));

  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  var line = new THREE.Line(geometry, material);
  scene.add(line);
  renderer.render(scene, camera);
}

function createAnimateCube() {
  var geometry = new THREE.BoxGeometry();
  var material = new THREE.MeshBasicMaterial({
    color: 'red'
  });
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  camera.position.z = 4;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
