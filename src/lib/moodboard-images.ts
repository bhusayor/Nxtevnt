"use client";

import { useEffect, useState } from "react";

const prefix = "nxtevnt-moodboard:";
const databaseName = "nxtevnt-moodboard-images";
const storeName = "images";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("Image storage isn’t available in this browser. Allow site storage and try again.")); return; }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName); };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(new Error("We couldn’t open image storage. Allow site storage and try again."));
    request.onblocked = () => reject(new Error("Close other NXTEVNT tabs and try uploading again."));
  });
}

async function imageTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () => reject(new Error(mode === "readwrite" ? "Your browser couldn’t save this image. Free up some site storage and try again." : "This image couldn’t be loaded from this browser."));
    });
  } finally { db.close(); }
}

/** Image payloads live outside localStorage so 50-image boards don't exhaust its small quota. */
export async function storeMoodboardImage(id: string, data: string) {
  if (!data.startsWith("data:image/")) throw new Error("This photo could not be prepared.");
  await imageTransaction("readwrite", (store) => store.put(data, id));
  return prefix + id;
}

export async function readMoodboardImage(source: string): Promise<string> {
  if (!source.startsWith(prefix)) return source;
  const data = await imageTransaction<string | undefined>("readonly", (store) => store.get(source.slice(prefix.length)));
  if (!data) throw new Error("This image isn’t available in this browser. Upload it again to restore it.");
  return data;
}

export async function deleteMoodboardImage(source?: string) {
  if (source?.startsWith(prefix)) await imageTransaction("readwrite", (store) => store.delete(source.slice(prefix.length)));
}

export function useMoodboardImage(source?: string) {
  const [loaded, setLoaded] = useState<{ source: string; src?: string; error?: string } | null>(null);
  const stored = Boolean(source?.startsWith(prefix));
  useEffect(() => {
    if (!source?.startsWith(prefix)) return;
    let cancelled = false;
    readMoodboardImage(source).then((src) => { if (!cancelled) setLoaded({ source, src }); }, (problem) => { if (!cancelled) setLoaded({ source, error: problem instanceof Error ? problem.message : "Photo unavailable" }); });
    return () => { cancelled = true; };
  }, [source]);
  if (!stored) return { src: source, loading: false, error: undefined };
  return { src: loaded?.source === source ? loaded?.src : undefined, loading: loaded?.source !== source, error: loaded?.source === source ? loaded?.error : undefined };
}
