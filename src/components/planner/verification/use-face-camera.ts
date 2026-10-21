"use client";

import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "opening" | "live" | "capturing";

export function faceCameraError(problem: unknown) {
  const name = problem instanceof Error ? problem.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow camera access in your browser settings and try again, or upload a photo instead.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No suitable camera was found. Connect a camera or upload a photo instead.";
  if (name === "NotReadableError" || name === "AbortError") return "Your camera could not start. It may be in use by another app. Close it there and try again, or upload a photo.";
  return "The camera could not be used. Please try again or upload a photo instead.";
}

export function useFaceCamera(onCapture: (file: File) => void, onError: (message: string) => void) {
  const [state, setState] = useState<CameraState>("idle"), [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const session = useRef<{ active: boolean; generation: number; stream: MediaStream | null }>({ active: true, generation: 0, stream: null });

  function release() {
    const stream = session.current.stream;
    session.current.stream = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  function stop() {
    session.current.generation++;
    release();
    setReady(false);
    setState("idle");
  }
  useEffect(() => {
    session.current.active = true;
    return () => { session.current.active = false; session.current.generation++; release(); };
    // Stream ownership belongs to this mounted dialog, not to a render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    stop();
    onError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      onError("Camera capture needs HTTPS or localhost and a supported browser. You can still upload a photo.");
      return;
    }
    const generation = session.current.generation;
    setState("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } } });
      if (!session.current.active || generation !== session.current.generation) { stream.getTracks().forEach((track) => track.stop()); return; }
      session.current.stream = stream;
      setState("live");
    } catch (problem) {
      if (session.current.active && generation === session.current.generation) { stop(); onError(faceCameraError(problem)); }
    }
  }

  useEffect(() => {
    const video = videoRef.current, stream = session.current.stream;
    if (state !== "live" || !video || !stream) return;
    const generation = session.current.generation;
    const failed = () => {
      if (session.current.active && generation === session.current.generation) { stop(); onError("The camera stopped. Try again or upload a photo instead."); }
    };
    video.srcObject = stream;
    const playing = video.play();
    playing?.catch(failed);
    stream.getTracks().forEach((track) => track.addEventListener("ended", failed));
    return () => { stream.getTracks().forEach((track) => track.removeEventListener("ended", failed)); };
    // Callbacks use the current stream generation to ignore late playback errors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function capture() {
    const video = videoRef.current;
    if (state !== "live" || !ready || !video?.videoWidth || !video.videoHeight) { onError("Wait for the camera preview before taking your photo."); return; }
    const generation = session.current.generation;
    setState("capturing");
    try {
      const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo capture unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Photo capture failed")), "image/jpeg", 0.9));
      if (!session.current.active || generation !== session.current.generation) return;
      onCapture(new File([blob], "face-photo.jpg", { type: "image/jpeg" }));
      stop(); onError("");
    } catch {
      if (session.current.active && generation === session.current.generation) { stop(); onError("Your photo could not be captured. Try again or upload a photo instead."); }
    }
  }

  return { state, ready, videoRef, start, stop, capture, markReady: () => setReady(true) };
}
