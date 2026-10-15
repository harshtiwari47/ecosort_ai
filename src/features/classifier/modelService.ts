import type * as tfTypes from '@tensorflow/tfjs-core';
import type * as tfLayersTypes from '@tensorflow/tfjs-layers';
import type { ModelStatus, RankedPrediction } from '../../types/domain';
import { rankPredictions } from './categoryMapping';

interface ModelManifest {
  version: string;
  inputSize: number;
  inputScale: number;
  labels: string[];
  source: string;
}

type TensorFlow = typeof import('@tensorflow/tfjs-core') & typeof import('@tensorflow/tfjs-layers');
type LoadedModel = tfLayersTypes.LayersModel;

const INITIAL_STATUS: ModelStatus = {
  state: 'not-loaded',
  message: 'Model assets load locally the first time you classify an image.',
  version: 'not checked yet',
};

let currentStatus: ModelStatus = INITIAL_STATUS;
let modelPromise: Promise<{ tf: TensorFlow; model: LoadedModel; manifest: ModelManifest }> | null = null;
const listeners = new Set<(status: ModelStatus) => void>();

export function getModelStatus(): ModelStatus {
  return currentStatus;
}

export function subscribeToModelStatus(listener: (status: ModelStatus) => void): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

function updateStatus(status: ModelStatus): void {
  currentStatus = status;
  for (const listener of listeners) listener(status);
}

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}models/waste/${path}`;
}

async function loadModel(): Promise<{ tf: TensorFlow; model: LoadedModel; manifest: ModelManifest }> {
  if (!modelPromise) {
    modelPromise = (async () => {
      updateStatus({ state: 'loading', message: 'Preparing TensorFlow.js and loading the local model…', version: currentStatus.version });
      try {
        const [tf, response] = await Promise.all([
          (async () => {
            const [core, layers] = await Promise.all([
              import('@tensorflow/tfjs-core'),
              import('@tensorflow/tfjs-layers'),
              import('@tensorflow/tfjs-backend-webgl'),
              import('@tensorflow/tfjs-backend-cpu'),
            ]).then(([loadedCore, loadedLayers]) => [loadedCore, loadedLayers] as const);
            if (typeof WebGLRenderingContext !== 'undefined') {
              try {
                if (!(await core.setBackend('webgl'))) await core.setBackend('cpu');
              } catch {
                await core.setBackend('cpu');
              }
            } else {
              await core.setBackend('cpu');
            }
            await core.ready();
            return Object.assign({}, core, layers) as TensorFlow;
          })(),
          fetch(assetUrl('config.json')),
        ]);
        if (!response.ok) throw new Error('Model configuration is missing from public/models/waste.');
        const manifest: ModelManifest = await response.json() as ModelManifest;
        if (!manifest.version || !Number.isInteger(manifest.inputSize) || manifest.inputSize < 32 ||
            !Number.isFinite(manifest.inputScale) || manifest.inputScale <= 0 ||
            !Array.isArray(manifest.labels) || manifest.labels.length !== 6) {
          throw new Error('The local model configuration is invalid. See the model setup instructions in the README.');
        }
        const model = await tf.loadLayersModel(assetUrl('model.json'));
        const inputShape = model.inputs[0]?.shape;
        const outputShape = model.outputs[0]?.shape;
        if (!inputShape || inputShape.length !== 4 || inputShape[1] !== manifest.inputSize ||
            inputShape[2] !== manifest.inputSize || !outputShape || outputShape[outputShape.length - 1] !== manifest.labels.length) {
          model.dispose();
          throw new Error('The model shape does not match its local configuration.');
        }
        updateStatus({ state: 'ready', message: 'Model assets are loaded on this device.', version: manifest.version });
        return { tf, model, manifest };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The local model could not be loaded.';
        const state = message.includes('missing') || message.includes('not configured') ? 'unavailable' : 'error';
        updateStatus({ state, message: `${message} Follow the model setup steps in the README.`, version: currentStatus.version });
        modelPromise = null;
        throw new Error(message);
      }
    })();
  }
  return modelPromise;
}

export async function predictImage(image: HTMLImageElement): Promise<RankedPrediction[]> {
  const { tf, model, manifest } = await loadModel();
  if (image.naturalWidth === 0 || image.naturalHeight === 0) throw new Error('The selected image could not be decoded. Try another image.');

  let output: tfTypes.Tensor | null = null;
  try {
    output = tf.tidy(() => {
      const pixels = tf.browser.fromPixels(image, 3);
      const resized = tf.image.resizeBilinear(pixels, [manifest.inputSize, manifest.inputSize]);
      const input = tf.expandDims(tf.mul(tf.cast(resized, 'float32'), manifest.inputScale), 0);
      const result = model.predict(input);
      if (Array.isArray(result)) throw new Error('The model returned multiple output tensors; the model assets are incompatible.');
      return result.clone();
    });
    const values = Array.from(await output.data());
    const scores = values.slice(0, manifest.labels.length);
    return rankPredictions(manifest.labels, scores);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image classification failed.';
    if (currentStatus.state === 'ready') updateStatus({ ...currentStatus, message: 'Model loaded; classification failed for this image.' });
    throw new Error(message);
  } finally {
    output?.dispose();
  }
}

export function cleanupClassifier(): void {
  if (!modelPromise) return;
  void modelPromise.then(({ model }) => model.dispose()).catch(() => undefined);
  modelPromise = null;
  updateStatus({ ...INITIAL_STATUS, message: 'Model resources were released. They will load again on demand.' });
}
