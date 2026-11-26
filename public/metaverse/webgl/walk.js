const directionKeys = new Map([
  ['KeyW', 'forward'], ['ArrowUp', 'forward'],
  ['KeyS', 'backward'], ['ArrowDown', 'backward'],
  ['KeyA', 'left'], ['ArrowLeft', 'left'],
  ['KeyD', 'right'], ['ArrowRight', 'right'],
  ['KeyQ', 'turnLeft'], ['KeyE', 'turnRight']
]);
const directions = {
  forward: [0, 1], backward: [0, -1], left: [-1, 0], right: [1, 0]
};

export function districtWalkRules({ bounds, lots }, padding = 0.6) {
  const footprints = lots.map(lot => lot.footprint);
  return (x, z) => x >= bounds.min.x + padding && x <= bounds.max.x - padding &&
    z >= bounds.min.z + padding && z <= bounds.max.z - padding &&
    !footprints.some(({ min, max }) => x > min.x - padding && x < max.x + padding &&
      z > min.z - padding && z < max.z + padding);
}

export function makeWalk(THREE, camera, canvas, { onMove, canMove = () => true } = {}) {
  const view = canvas.ownerDocument.defaultView;
  const aim = new THREE.Vector3();
  const startTarget = new THREE.Vector3();
  const held = new Set();
  const speed = 7.5;
  const stepDistance = 1.35;
  const lookSensitivity = 0.005;
  const turnSpeed = Math.PI / 2;
  const maxPitch = Math.PI / 2 - 0.06;
  let started = false;
  let active = false;
  let yaw = 0;
  let pitch = 0;
  let drag = null;

  function assign(vector, value) {
    if (Array.isArray(value)) vector.fromArray(value);
    else vector.copy(value);
  }

  function pointCamera() {
    const horizontal = Math.cos(pitch);
    aim.set(
      camera.position.x + Math.sin(yaw) * horizontal,
      camera.position.y + Math.sin(pitch),
      camera.position.z - Math.cos(yaw) * horizontal
    );
    camera.lookAt(aim);
  }

  function look(dx, dy) {
    if (!active || (!dx && !dy)) return;
    yaw += dx * lookSensitivity;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch - dy * lookSensitivity));
    pointCamera();
    onMove?.();
  }

  function keydown(event) {
    if (!directionKeys.has(event.code) || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    if (held.has(event.code)) return;
    held.add(event.code);
    onMove?.();
  }

  function keyup(event) {
    held.delete(event.code);
  }

  function clearInput() {
    held.clear();
    const oldDrag = drag;
    drag = null;
    if (oldDrag && canvas.hasPointerCapture?.(oldDrag.id)) canvas.releasePointerCapture(oldDrag.id);
  }

  function pointerdown(event) {
    if (drag || event.button !== 0) return;
    drag = {
      id: event.pointerId,
      startX: event.clientX, startY: event.clientY,
      previousX: event.clientX, previousY: event.clientY,
      moved: false
    };
  }

  function pointermove(event) {
    if (drag?.id !== event.pointerId) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= 4) return;
      drag.moved = true;
      canvas.setPointerCapture?.(event.pointerId);
    }
    const dx = event.clientX - drag.previousX;
    const dy = event.clientY - drag.previousY;
    drag.previousX = event.clientX;
    drag.previousY = event.clientY;
    look(dx, dy);
  }

  function pointerend(event) {
    if (drag?.id === event.pointerId) drag = null;
  }

  const viewEvents = { blur: clearInput, pointerup: pointerend, pointercancel: pointerend };
  const canvasEvents = { keydown, keyup, blur: clearInput, pointerdown, pointermove, pointerup: pointerend, pointercancel: pointerend, lostpointercapture: pointerend };

  function listen(method) {
    for (const [type, callback] of Object.entries(viewEvents)) view[method](type, callback);
    for (const [type, callback] of Object.entries(canvasEvents)) canvas[method](type, callback);
  }

  function start(position, target) {
    clearInput();
    started = true;
    resume();
    assign(camera.position, position);
    assign(startTarget, target);
    const dx = startTarget.x - camera.position.x;
    const dy = startTarget.y - camera.position.y;
    const dz = startTarget.z - camera.position.z;
    yaw = dx || dz ? Math.atan2(dx, -dz) : 0;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, Math.atan2(dy, Math.hypot(dx, dz))));
    pointCamera();
    onMove?.();
  }

  function pause() {
    if (!active) return;
    active = false;
    clearInput();
    listen('removeEventListener');
  }

  function resume() {
    if (!started || active) return;
    active = true;
    listen('addEventListener');
  }

  function stop() {
    pause();
    started = false;
  }

  function move(right, forward, distance) {
    if (!active || !distance || (!right && !forward)) return;
    const { position } = camera;
    const scale = distance / Math.hypot(right, forward);
    const dx = (Math.cos(yaw) * right + Math.sin(yaw) * forward) * scale;
    const dz = (Math.sin(yaw) * right - Math.cos(yaw) * forward) * scale;
    const startX = position.x;
    const startZ = position.z;
    // Short steps check corners without skipping thin collision margins.
    const subdivisions = Math.ceil(distance / 0.35);
    for (let i = 0; i < subdivisions; i++) {
      const x = position.x + dx / subdivisions;
      const z = position.z + dz / subdivisions;
      if (canMove(x, z)) {
        position.x = x;
        position.z = z;
      } else {
        if (dx && canMove(x, position.z)) position.x = x;
        if (dz && canMove(position.x, z)) position.z = z;
      }
    }
    if (position.x !== startX || position.z !== startZ) {
      pointCamera();
      onMove?.();
    }
  }

  function step(direction) {
    if (!Object.hasOwn(directions, direction)) return;
    const [right, forward] = directions[direction];
    move(right, forward, stepDistance);
  }

  function update(delta) {
    if (!active || !held.size || !(delta > 0)) return;
    const pressed = new Set(Array.from(held, code => directionKeys.get(code)));
    const right = Number(pressed.has('right')) - Number(pressed.has('left'));
    const forward = Number(pressed.has('forward')) - Number(pressed.has('backward'));
    const dt = Math.min(delta, 0.05);
    const turning = Number(pressed.has('turnRight')) - Number(pressed.has('turnLeft'));
    if (turning) {
      yaw += turning * turnSpeed * dt;
      pointCamera();
    }
    move(right, forward, dt * speed);
  }

  return {
    start, stop, pause, resume, update, step, look,
    get active() { return active; },
    get moving() { return active && held.size > 0; }
  };
}
