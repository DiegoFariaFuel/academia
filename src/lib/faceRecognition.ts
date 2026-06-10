/**
 * Face recognition utilities using @vladmandic/face-api.
 * Wraps model loading, descriptor extraction, and matching.
 */
import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

/**
 * Load SSD Mobilenet, Landmark68, and FaceRecognition models from /models.
 * Safe to call multiple times — skips if already loaded.
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

/**
 * Detect a single face in a video/image element and return its 128-dim descriptor.
 * Returns null if no face is found.
 */
export async function detectSingleFace(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

/**
 * Compute Euclidean distance between two 128-dim descriptors.
 */
export function euclideanDistance(a: Float32Array, b: Float32Array): number {
  return faceapi.euclideanDistance(
    Array.from(a) as number[],
    Array.from(b) as number[],
  );
}

/**
 * Serialize a Float32Array descriptor to a JSON-compatible string.
 */
export function descriptorToJson(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

/**
 * Deserialize a JSON string back into a Float32Array descriptor.
 */
export function jsonToDescriptor(json: string): Float32Array {
  return new Float32Array(JSON.parse(json) as number[]);
}

/**
 * Given a descriptor and a list of known faces, return the best match.
 * Returns { alunoId, distance } or null if no match is below threshold.
 */
export function findBestMatch(
  descriptor: Float32Array,
  knownFaces: { alunoId: string; descriptor: Float32Array }[],
  threshold = 0.55,
): { alunoId: string; distance: number } | null {
  let bestMatch: { alunoId: string; distance: number } | null = null;

  for (const face of knownFaces) {
    const dist = euclideanDistance(descriptor, face.descriptor);
    if (dist < threshold && (!bestMatch || dist < bestMatch.distance)) {
      bestMatch = { alunoId: face.alunoId, distance: dist };
    }
  }

  return bestMatch;
}
