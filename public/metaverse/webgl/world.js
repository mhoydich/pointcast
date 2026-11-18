// Geometry and landscape for the WebGL edition of the PointCast district.
export function buildWorld(THREE, scene) {
  const { sites, lotHalf } = window.LoomCityLayout;
  const plates = window.LoomBuildings.slice(0, sites.length);
  const grade = .22;
  const district = new THREE.Group();
  district.name = 'PointCast district';
  scene.add(district);

  const targets = [];
  const markers = [];
  const lots = [];
  const outlines = [];
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();
  const materials = new Map();
  const coloredMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color);
  }

  // Small landscape primitives share one instanced draw per geometry/material.
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const trunk = new THREE.CylinderGeometry(.33, .5, 1, 6);
  const canopy = new THREE.IcosahedronGeometry(.55, 1);
  const plant = new THREE.IcosahedronGeometry(.55, 0);
  const instanceSets = new Map();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 1, 0);
  const scale = new THREE.Vector3();
  function place(geometry, color, x, y, z, w, h, d, casts = false, angle = 0) {
    const surface = material(color);
    const key = `${geometry.id}:${surface.id}:${casts}`;
    if (!instanceSets.has(key)) instanceSets.set(key, { geometry, surface, casts, matrices: [] });
    point.set(x, y, z);
    scale.set(w, h, d);
    quaternion.setFromAxisAngle(axis, angle);
    instanceSets.get(key).matrices.push(matrix.compose(point, quaternion, scale).clone());
  }

  function block(color, x, y, z, w, h, d, casts) {
    place(cube, color, x, y + h / 2, z, w, h, d, casts);
  }

  function support(color, x, z, length, side, height) {
    const horizontal = side === 'x';
    block(color, x, .025, z, horizontal ? length : .14, height, horizontal ? .14 : length, true);
  }

  function path(x, z, width, depth, base = -.01) {
    block('#c9bdab', x, base, z, width + .22, .045, depth + .22);
    block('#e8dcc7', x, base + .045, z, width, .009, depth);
  }

  function garden(x, z, width, depth) {
    block('#9da77f', x, .027, z, width, .04, depth);
  }

  function tree(x, z, variety, height = 1) {
    const greens = ['#6f8c58', '#829963', '#9ba36c'];
    const color = greens[variety % greens.length];
    place(trunk, '#796052', x, 2.1 * height, z, .38 * height, 4.2 * height, .37 * height, true);
    place(canopy, color, x, 5 * height, z, 3.28 * height, 4.35 * height, 3.0 * height, true, variety);
  }

  function planter(x, z, length, seed) {
    block('#b3a994', x, grade, z, length, .45, 1.35, true);
    block('#756c52', x, grade + .45, z, length - .19, .025, 1.15);
    for (let n = 0; n < 5; n++) {
      const color = ['#828c58', '#738553', '#9da365', '#a48b59'][(n + seed) % 4];
      place(plant, color, x + (n - 2) * length / 5, grade + .63, z, .83, .68 + .15 * (n % 3), .83, true, n + seed);
    }
  }

  function bench(x, z) {
    for (const side of [-1, 1]) block('#635d51', x + side * .86, grade, z, .14, .53, .48, true);
    for (let k = 0; k < 3; k++) block('#966a49', x, grade + .49, z + (k - 1) * .17, 2.28, .10, .145, true);
    block('#966a49', x, grade + .85, z - .22, 2.28, .14, .08, true);
    for (const side of [-1, 1]) block('#635d51', x + side * .86, grade + .53, z - .22, .09, .42, .08, true);
  }

  function createBuilding(faces, x, z, index) {
    const footprint = new THREE.Box3();
    for (const casts of [true, false]) {
      const positions = [];
      const colors = [];
      const color = new THREE.Color();
      for (const face of faces) {
        if ((face.shadow !== false) !== casts) continue;
        const vertices = face.vertices.map(([px, py, pz]) => [px + x, py + grade, pz + z]);
        color.set(face.color);
        for (const vertex of vertices) footprint.expandByPoint(point.fromArray(vertex));
        for (let i = 1; i < vertices.length - 1; i++) {
          positions.push(...vertices[0], ...vertices[i], ...vertices[i + 1]);
          colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
        }
      }
      if (!positions.length) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, coloredMaterial);
      mesh.name = plates[index].title || plates[index].id;
      mesh.castShadow = casts;
      mesh.receiveShadow = true;
      mesh.userData.plate = index;
      district.add(mesh);
      targets.push(mesh);
    }
    return footprint;
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), material('#aba98c'));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'Garden ground';
  district.add(ground);

  // Pale paving follows the site grid, with an uninterrupted pedestrian loop on each terrace.
  const lotWidth = lotHalf * 2;
  const pitch = sites[1][0] - sites[0][0];
  const lane = pitch - lotWidth;
  for (let index = 0; index < plates.length; index++) {
    const plate = plates[index];
    const [x, z] = sites[index];
    const model = window.LoomModel(plate.model || plate.id || plate.title, index);
    const footprint = createBuilding(model.faces, x, z, index);
    lots.push({ index, x, z, footprint });
    bounds.union(footprint);
    bounds.expandByPoint(point.set(x - lotHalf - lane, 0, z - lotHalf - lane));
    bounds.expandByPoint(point.set(x + lotHalf + lane, grade, z + lotHalf + lane));
    block('#baae92', x, .03, z, lotWidth, grade - .055, lotWidth, true);
    block('#ddd0b7', x, grade - .025, z, lotWidth - .19, .025, lotWidth - .19);

    // Site edges share centerlines. The set prevents coincident surfaces between neighbors.
    planter(x - 7.3, z + 11.6, 3.4, index);
    bench(x + 6.6, z + 11.72);
    const y = grade + .015;
    const edge = lotHalf - .38;
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - edge, y, z - edge), new THREE.Vector3(x + edge, y, z - edge),
        new THREE.Vector3(x + edge, y, z + edge), new THREE.Vector3(x - edge, y, z + edge),
      ]),
      new THREE.LineBasicMaterial({ color: '#ad503a' })
    );
    outlines.push(outline);
    district.add(outline);
    markers.push(new THREE.Vector3(x + 11.9, .9, z + 11.9));
  }

  const laid = new Set();
  for (const { x, z } of lots) {
    for (const side of [-1, 1]) {
      const east = x + side * pitch / 2;
      const south = z + side * pitch / 2;
      const vertical = `v:${east}:${z}`;
      const horizontal = `h:${x}:${south}`;
      if (!laid.has(vertical)) {
        path(east, z, lane, pitch - lane);
        laid.add(vertical);
      }
      if (!laid.has(horizontal)) {
        path(x, south, pitch - lane, lane);
        laid.add(horizontal);
      }
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cornerX = x + sx * pitch / 2;
      const cornerZ = z + sz * pitch / 2;
      const key = `c:${cornerX}:${cornerZ}`;
      if (!laid.has(key)) {
        path(cornerX, cornerZ, lane, lane);
        laid.add(key);
      }
    }
  }

  // Pocket gardens occupy two unbuilt sites and leave the promenades open for walking.
  for (const [x, z] of [[-46.5, 15.5], [-15.5, 46.5]]) {
    garden(x, z, 24.8, 25.25);
    path(x, z, 3.6, 25.25, .03);
    support('#b5a98a', x, z - 12.7, 24.8, 'x', .12);
    support('#b5a98a', x, z + 12.7, 24.8, 'x', .12);
    for (const [dx, dz, variant, size] of [[-7,-7,0,1], [7,-5,1,.83], [-7,4,2,.76], [7,7,0,.95]]) {
      tree(x + dx, z + dz, variant, size);
    }
  }

  for (const [x, z, color, height] of [
    [-65,-26,0,.8], [-65,-14,1,.72], [-65,-3,2,.7], [-60,33,1,.82],
    [-43,-35,2,.8], [-29,-35,1,.91], [-16,-35,0,.89], [-4,-35,2,.82],
    [18,-36,0,.89], [30,-33,2,.74], [35,-18,1,.86], [35,-7,0,.77],
    [36,3,1,.83], [35,17,2,.79], [35,46,1,.84], [34,58,2,.7],
    [22,65,0,.85], [10,64,1,.78], [-1,64,2,.69], [-22,65,1,.74],
  ]) tree(x, z, color, height);

  for (const { geometry, surface, casts, matrices } of instanceSets.values()) {
    const mesh = new THREE.InstancedMesh(geometry, surface, matrices.length);
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow = casts;
    mesh.receiveShadow = true;
    district.add(mesh);
  }

  function select(index) {
    outlines.forEach((outline, plate) => { outline.visible = index === plate; });
  }
  select(0);

  const center = bounds.getCenter(new THREE.Vector3());
  center.y = 0;
  const size = bounds.getSize(new THREE.Vector3());
  return { targets, markers, center, radius: Math.hypot(size.x, size.z) / 2, bounds, lots, select };
}
