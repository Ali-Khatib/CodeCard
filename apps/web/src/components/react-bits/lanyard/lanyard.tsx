'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, type ThreeElement, type ThreeEvent } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';

import cardGLB from './card.glb';
import lanyardImg from './lanyard.png';

const LANYARD_TEX = typeof lanyardImg === 'string' ? lanyardImg : lanyardImg.src;

/** Geometry-only GLB — badge faces are composited at runtime (no embedded textures). */
const extendLanyardLoader = (loader: GLTFLoader) => {
  loader.manager.onError = (url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) return;
  };
};

useGLTF.preload(cardGLB, false, false, extendLanyardLoader);

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial> & {
      useMap?: boolean | number;
      map?: THREE.Texture;
      repeat?: [number, number];
      lineWidth?: number;
      resolution?: [number, number];
    };
  }
}

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  scrollProgress?: number;
  cardScale?: number;
  className?: string;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  scrollProgress = 0,
  cardScale = 2.25,
  className = '',
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const gravityScale =
    scrollProgress >= 0.45 ? Math.max(0, 1 - (scrollProgress - 0.45) / 0.2) : 1;
  const scaledGravity: [number, number, number] = [
    gravity[0],
    gravity[1] * gravityScale,
    gravity[2],
  ];

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative z-0 h-full w-full ${className}`}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
        data-testid="lanyard-canvas"
      >
        <ambientLight intensity={0.45} color="#c4a7ff" />
        <directionalLight position={[5, 8, 6]} intensity={2.2} color="#c4a7ff" />
        <directionalLight position={[-4, -1, 5]} intensity={1.1} color="#7c3aed" />
        <pointLight position={[2, 4, 5]} intensity={0.8} color="#a855f7" />
        <pointLight position={[-3, 2, 3]} intensity={0.4} color="#4c1d95" />
        <Physics gravity={scaledGravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            scrollProgress={scrollProgress}
            cardScale={cardScale}
          />
        </Physics>
        <Environment blur={0.6}>
          <Lightformer intensity={2.5} color="#c4a7ff" position={[4, 6, 5]} rotation={[0, 0, 0]} scale={[80, 0.15, 1]} />
          <Lightformer intensity={1.8} color="#7c3aed" position={[-3, 2, 4]} rotation={[0, 0, 0]} scale={[60, 0.12, 1]} />
          <Lightformer intensity={1.2} color="#a855f7" position={[0, -2, 6]} rotation={[0, 0, 0]} scale={[100, 0.1, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  scrollProgress?: number;
  cardScale?: number;
}

type LanyardRigidBody = RapierRigidBody & {
  lerped?: THREE.Vector3;
};

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  scrollProgress = 0,
  cardScale = 2.25,
}: BandProps) {
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LanyardRigidBody>(null!);
  const j2 = useRef<LanyardRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: RigidBodyProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const getLerped = (body: LanyardRigidBody): THREE.Vector3 => {
    if (!body.lerped) {
      body.lerped = new THREE.Vector3().copy(body.translation());
    }

    return body.lerped;
  };

  const gltf = useGLTF(cardGLB, false, false, extendLanyardLoader) as unknown as {
    nodes: {
      card?: { geometry: THREE.BufferGeometry };
      clip?: { geometry: THREE.BufferGeometry };
      clamp?: { geometry: THREE.BufferGeometry };
    };
    materials: { base?: THREE.MeshStandardMaterial; metal?: THREE.MeshStandardMaterial };
  };
  const { nodes, materials } = gltf;

  useEffect(() => {
    const map = materials.base?.map;
    if (map) {
      map.dispose();
      if (materials.base) materials.base.map = null;
    }
  }, [materials.base]);

  const placeholderMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const metalMaterial = useMemo(
    () =>
      materials.metal ??
      new THREE.MeshStandardMaterial({ color: '#a855f7', metalness: 0.9, roughness: 0.2 }),
    [materials.metal],
  );

  const texture = useTexture(lanyardImage || LANYARD_TEX);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  const ATLAS_W = 2048;
  const ATLAS_H = 2048;

  const [cardMap, setCardMap] = useState<THREE.Texture>(() => placeholderMap);

  // Composite badge faces without relying on GLTF embedded textures (blob URLs often fail).
  useEffect(() => {
    if (!frontImage && !backImage) {
      setCardMap(placeholderMap);
      return;
    }

    let disposed = false;

    const buildComposite = () => {
      const frontImg = frontTex.image as HTMLImageElement | undefined;
      const backImg = backTex.image as HTMLImageElement | undefined;
      const frontReady =
        frontImg instanceof HTMLImageElement &&
        frontImg.complete &&
        frontImg.naturalWidth > 0;
      const backReady =
        backImg instanceof HTMLImageElement && backImg.complete && backImg.naturalWidth > 0;
      if (!frontReady || !backReady) return false;

      const W = ATLAS_W;
      const H = ATLAS_H;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, W, H);

      const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
        const rx = rect.x * W;
        const ry = rect.y * H;
        const rw = rect.w * W;
        const rh = rect.h * H;
        const pick = imageFit === 'contain' ? Math.min : Math.max;
        const scale = pick(rw / img.naturalWidth, rh / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = rx + (rw - dw) / 2;
        const dy = ry + (rh - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };

      drawFitted(frontImg, FRONT_UV_RECT);
      drawFitted(backImg, BACK_UV_RECT);

      const composite = new THREE.CanvasTexture(canvas);
      composite.colorSpace = THREE.SRGBColorSpace;
      composite.flipY = true;
      composite.anisotropy = 16;
      composite.needsUpdate = true;
      if (!disposed) setCardMap(composite);
      return true;
    };

    if (buildComposite()) return;

    const interval = window.setInterval(() => {
      if (buildComposite()) window.clearInterval(interval);
    }, 40);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [frontImage, backImage, imageFit, frontTex, backTex, placeholderMap]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    const freeze = scrollProgress >= 0.65;
    const dampPhysics = scrollProgress >= 0.45;
    const strapRetract = Math.min(1, Math.max(0, (scrollProgress - 0.45) / 0.2));

    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    } else if (dampPhysics && card.current && !freeze) {
      const t = strapRetract;
      const pos = card.current.translation();
      const targetX = THREE.MathUtils.lerp(pos.x, 2, t * delta * 3);
      const targetY = THREE.MathUtils.lerp(pos.y, 0, t * delta * 3);
      card.current.setNextKinematicTranslation({ x: targetX, y: targetY, z: pos.z });
      card.current.setAngvel(
        {
          x: card.current.angvel().x * (1 - t * 0.15),
          y: card.current.angvel().y * (1 - t * 0.15),
          z: card.current.angvel().z * (1 - t * 0.15),
        },
        true,
      );
    }
    if (freeze && card.current) {
      card.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const bandMaterial = useMemo(() => {
    const mat = new MeshLineMaterial({
      color: 'white',
      resolution: isMobile ? new THREE.Vector2(1000, 2000) : new THREE.Vector2(1000, 1000),
      useMap: 1,
      map: texture,
      repeat: new THREE.Vector2(-4, 1),
      lineWidth: lanyardWidth,
    } as ConstructorParameters<typeof MeshLineMaterial>[0]);
    mat.depthTest = false;
    return mat;
  }, [isMobile, texture, lanyardWidth]);

  const cardGeometry = nodes.card?.geometry;
  const clipGeometry = nodes.clip?.geometry;
  const clampGeometry = nodes.clamp?.geometry;

  const strapOffset = Math.min(2.5, Math.max(0, (scrollProgress - 0.45) / 0.2) * 2.5);

  return (
    <>
      <group position={[0, 4 + strapOffset, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={cardScale}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            {cardGeometry && (
              <mesh geometry={cardGeometry}>
                <meshPhysicalMaterial
                  map={cardMap}
                  map-anisotropy={16}
                  clearcoat={isMobile ? 0 : 1}
                  clearcoatRoughness={0.1}
                  roughness={0.35}
                  metalness={0.65}
                  color="#0f0217"
                  emissive="#4c1d95"
                  emissiveIntensity={0.08}
                />
              </mesh>
            )}
            {clipGeometry && (
              <mesh geometry={clipGeometry} material={metalMaterial} material-roughness={0.3} />
            )}
            {clampGeometry && <mesh geometry={clampGeometry} material={metalMaterial} />}
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <primitive object={bandMaterial} attach="material" />
      </mesh>
    </>
  );
}
