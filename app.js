'use strict';

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

// 캔버스 초기화 방지하기
function main() {
  // WebGLRenderer는 기본적으로 새로운 프레임을 그리기 이전에 WebGL 캔버스에 그려진 그림(즉, 드로잉버퍼)를 지워줌.
  // 이런 식의 캔버스 초기화 기능을 방지하면 이전 프레임에 그려진 그림이 남게 되면서 
  // pointermove 흔적을 따라 그림이 그려지는 듯한 효과를 줄 수 있음.
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true, // 얘는 이전 캔버스에 그려진 드로잉 버퍼를 지우지 않고 냅두도록 함. 원래 기본값은 false
    alpha: true // 얘는 png 이미지처럼 캔버스가 알파(투명) 버퍼를 포함할 지 여부를 나타냄. 이게 true면 물체를 제외한 나머지 배경은 투명 처리되어 이전에 그려진 캔버스 그림들이 다 비쳐서 보이겠지 
  });
  renderer.autoClearColor = false;
  // renderer가 색상 버퍼를 자동으로 지워줄 지 말지를 결정함. 그거를 원래는 지워주고 나서 다음 프레임을 그려줘야 하는데, 여기서는 이전 캔버스의 그림을 남기려는 거니까 false로 설정한 것.

  // OrthographicCamera를 생성하여 원근없이 씬의 정면만 보이도록 렌더링하려는 거지
  const camera = new THREE.OrthographicCamera(-2, 2, 1, -1, 1, -1, 1); // 각각 left, right, top, bottom, near, far값을 전달한 것.

  // create scene
  const scene = new THREE.Scene();

  // create directional light;
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // 큐브 메쉬를 만들 때 사용할 BoxGeometry 생성
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // 생성한 큐브 메쉬들을 묶어줄 부모노드 생성
  const base = new THREE.Object3D();
  scene.add(base);
  base.scale.set(0.1, 0.1, 0.1); // 전체적으로 사이즈를 0.1배 해줘서 base 안에 추가될 큐브 메쉬들의 사이즈도 각각 0.1배가 되겠지

  // 퐁-머티리얼을 생성한 뒤 큐브 메쉬를 만들고, 큐브 메쉬를 Object3D안에 넣어주는 함수
  function makeInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    base.add(cube);

    cube.position.set(x, y, z);

    return cube;
  }

  makeInstance(geometry, '#F00', -2, 0, 0); // 넘겨주는 좌표값을 보면 처음에는 왼쪽에 렌더해 줄 큐브지?
  makeInstance(geometry, '#FF0', 2, 0, 0); // 오른쪽 큐브
  makeInstance(geometry, '#0F0', 0, -2, 0); // 아래쪽 큐브
  makeInstance(geometry, '#0FF', 0, 2, 0); // 위쪽 큐브
  makeInstance(geometry, '#00F', 0, 0, -2); // 가운데(앞쪽) 큐브
  makeInstance(geometry, '#F0F', 0, 0, 2); // 가운데(뒷쪽) 큐브

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // mousemove 또는 touchmove 이벤트를 받아서 부모노드인 base의 위치값으로 할당해 줄 x, y좌표값이 계산되어 담길 객체를 생성함.
  const state = {
    x: 0,
    y: 0
  };

  // animate
  function animate(t) {
    t *= 0.001; // 밀리초 단위의 타임스탬프값을 초단위로 변환

    // 캔버스를 리사이즈 하면 카메라의 비율도 캔버스 리사이즈에 맞춰서 업데이트해줌.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.right = canvas.clientWidth / canvas.clientHeight; // canvas.clientHeight이 1이라는 걸 가정하고 그거를 기준으로 clientWidth가 얼마나 늘어났냐의 비율이니까 카메라에 width를 결정할 수 있는 camera.right값에 할당해도 괜찮을 거 같음..
      camera.left = -camera.right; // left는 right의 반대방향에 위치하는 거니까 -camera.right으로 할당해준 거고...
      camera.updateProjectionMatrix();
    }

    // 큐브 메쉬들을 담고 있는 부모 노드의 위치값과 rotation값을 매 프레임마다 계산하여 할당해 줌. (참고로 위치값은 state에 계산 후 할당된 결과를 가져와서 사용함.)
    base.position.set(state.x, state.y, 0); // XY축을 기준으로만 움직이게 할거니까 z좌표값은 항상 0으로 해줘야겠지
    base.rotation.x = t;
    base.rotation.y = t * 1.11;

    renderer.render(scene, camera);

    // 내부에서 animate 반복 호출함
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // 현재 canvas의 css width, height, offset 값이 담긴 DOMRect를 가져온 뒤, 현재 캔버스의 픽셀 사이즈와의 비율과 비교하여 마우스 이벤트의 clientX,Y값을 다시 계산해주는 거 같음.
  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    }
  }

  // state에 넣어줄 x, y좌표값을 담아놓을 Vector3 객체를 생성해놓음
  const temp = new THREE.Vector3();

  // 캔버스 비율에 맞게 수정한 e.clientX,Y 좌표값을 가져온 뒤, y좌표값의 경우 e.clientY랑 scene의 3D 공간 상의 y좌표값이랑 방향이 다르니까 각 축의 방향에 맞게 1 또는 -1을 곱한 뒤 state에 할당하는 거 같음. 
  function setPosition(e) {
    const pos = getCanvasRelativePosition(e);
    const x = pos.x / canvas.width * 2 - 1;
    const y = pos.y / canvas.height * -2 + 1;
    // pos.x,y는 정확히 말하면 canvas의 0, 0 지점에서부터 각각 clientX,Y의 거리값이니까, 전체 canvas.width, height에서 해당 거리값이 얼마인지의 비율로 계산해줘야 우리가 원하는 좌표값이 나오겠지.
    temp.set(x, y, 0).unproject(camera); // Vector3.unproject(camera)는 현재 이 벡터를 카메라의 NDC 좌표값에서 전역공간으로 투영해주는 메소드라는데 뭔 소리인지 모르겠네..ㅠ
    state.x = temp.x;
    state.y = temp.y; // 어쨋든 이벤트의 좌표값을 전역공간의 좌표값으로 투영해서 얻어진 결과값을 state.x, y에 넣어줬으니까... 이걸 animate에서 쓸 수 있게 됬음.
  }

  // mousemove 또는 touchmove 이벤트를 받으면 이벤트의 좌표값을 전역공간의 좌표값으로 계산해줘서 state에 넣어주는 함수인 setPosition을 호출함.
  canvas.addEventListener('mousemove', setPosition);
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // touch 이벤트의 여러 기본 동작들을 꺼줌.
    setPosition(e.touches[0]); // touchmove의 경우 이벤트의 clientX,Y 좌표값이 담긴 부분이 e.touches[0]인가 봄.
  }, {
    passive: false
  }); // addEventListener에서 passive값을 true로 전달하면 listener가 지정한 콜백함수가 preventDefault를 호출하지 않도록 함. 그럼 false면 당연히 호출하도록 하겠지? 
}

main();

// 근데 이거로 드로잉 프로그램을 만드는 건 적합하지 않다고 함.
// 왜냐면 브라우저가 리사이징 될때마다 캔바스가 초기화되기 때문에...