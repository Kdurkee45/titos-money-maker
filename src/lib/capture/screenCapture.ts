/**
 * Screen Capture API Wrapper
 * Handles requesting screen share permission and capturing frames
 */

import { CapturedFrame, CaptureOptions, CaptureState } from './types';

// Default capture options
const DEFAULT_OPTIONS: Required<CaptureOptions> = {
  fps: 2,
  quality: 0.8,
  detectRegions: true,
};

/**
 * Request screen capture permission and get media stream
 */
export async function requestScreenCapture(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen capture is not supported in this browser');
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        // @ts-expect-error - cursor is a valid property but not in TypeScript types
        cursor: 'never',
        displaySurface: 'window',
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen capture permission denied');
      }
      throw error;
    }
    throw new Error('Failed to start screen capture');
  }
}

/**
 * Create a video element for the stream
 */
export function createVideoElement(stream: MediaStream): HTMLVideoElement {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  
  return video;
}

/**
 * Wait for video to be ready
 */
export function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) {
      resolve();
      return;
    }

    const onLoadedData = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      resolve();
    };

    const onError = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      reject(new Error('Video failed to load'));
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', onError);

    // Timeout after 10 seconds
    setTimeout(() => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      reject(new Error('Video load timeout'));
    }, 10000);
  });
}

/**
 * Capture a single frame from the video
 */
export function captureFrame(video: HTMLVideoElement): CapturedFrame {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return {
    imageData,
    timestamp: Date.now(),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Stop screen capture
 */
export function stopCapture(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Check if stream is still active
 */
export function isStreamActive(stream: MediaStream): boolean {
  return stream.getTracks().some(track => track.readyState === 'live');
}

/**
 * Screen Capture Manager Class
 * Manages the capture lifecycle and frame extraction
 */
export class ScreenCaptureManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private intervalId: number | null = null;
  private options: Required<CaptureOptions>;
  private onFrame: ((frame: CapturedFrame) => void) | null = null;
  private state: CaptureState = {
    isCapturing: false,
    stream: null,
    fps: 0,
    lastFrameTime: 0,
    frameCount: 0,
    errors: [],
  };

  constructor(options: CaptureOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get current state
   */
  getState(): CaptureState {
    return { ...this.state };
  }

  /**
   * Start capturing
   */
  async start(onFrame: (frame: CapturedFrame) => void): Promise<void> {
    if (this.state.isCapturing) {
      throw new Error('Capture already in progress');
    }

    this.onFrame = onFrame;
    this.state.errors = [];

    try {
      // Request screen capture permission
      this.stream = await requestScreenCapture();
      this.state.stream = this.stream;

      // Create video element
      this.video = createVideoElement(this.stream);
      await waitForVideoReady(this.video);

      // Listen for stream end
      this.stream.getTracks()[0].addEventListener('ended', () => {
        this.stop();
      });

      // Start frame capture loop
      this.state.isCapturing = true;
      this.startCaptureLoop();

    } catch (error) {
      this.state.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Stop capturing
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.stream) {
      stopCapture(this.stream);
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.state.isCapturing = false;
    this.state.stream = null;
    this.onFrame = null;
  }

  /**
   * Start the capture loop
   */
  private startCaptureLoop(): void {
    const intervalMs = 1000 / this.options.fps;

    this.intervalId = window.setInterval(() => {
      if (!this.video || !this.onFrame) return;

      try {
        const frame = captureFrame(this.video);
        this.state.frameCount++;
        
        // Calculate actual FPS
        const now = Date.now();
        if (this.state.lastFrameTime > 0) {
          const elapsed = now - this.state.lastFrameTime;
          this.state.fps = Math.round(1000 / elapsed * 10) / 10;
        }
        this.state.lastFrameTime = now;

        this.onFrame(frame);
      } catch (error) {
        this.state.errors.push(error instanceof Error ? error.message : 'Frame capture error');
      }
    }, intervalMs);
  }

  /**
   * Capture a single frame on demand
   */
  captureNow(): CapturedFrame | null {
    if (!this.video || !this.state.isCapturing) {
      return null;
    }

    try {
      return captureFrame(this.video);
    } catch {
      return null;
    }
  }

  /**
   * Update capture options
   */
  setOptions(options: Partial<CaptureOptions>): void {
    this.options = { ...this.options, ...options };

    // Restart capture loop with new FPS if capturing
    if (this.state.isCapturing && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.startCaptureLoop();
    }
  }
}
