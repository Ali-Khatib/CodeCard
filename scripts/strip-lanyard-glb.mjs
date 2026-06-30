/**
 * Strip embedded textures from card.glb — we composite badge faces at runtime.
 * Embedded images create blob: URLs that GLTFLoader revokes before TextureLoader finishes.
 */
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const glbPath = path.resolve(
  __dirname,
  '../apps/web/src/components/react-bits/lanyard/card.glb',
);

const io = new NodeIO();
const document = await io.read(glbPath);
const root = document.getRoot();

for (const material of root.listMaterials()) {
  material.setBaseColorTexture(null);
  material.setMetallicRoughnessTexture(null);
  material.setNormalTexture(null);
  material.setOcclusionTexture(null);
  material.setEmissiveTexture(null);
}

for (const texture of [...root.listTextures()]) {
  texture.dispose();
}

await prune(document);
await io.write(glbPath, document);

console.log(
  `Stripped textures from ${glbPath} (textures: ${root.listTextures().length}, materials: ${root.listMaterials().length})`,
);
