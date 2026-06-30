import { readFileSync } from 'fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const loader = new GLTFLoader();
const buf = readFileSync(join(dir, '../src/components/react-bits/lanyard/card.glb'));
loader.parse(buf.buffer, '', (gltf) => {
  console.log('nodes', Object.keys(gltf.nodes));
  console.log('materials', Object.keys(gltf.materials));
  console.log('meshes', gltf.scene.children.length);
}, (e) => console.error(e));
