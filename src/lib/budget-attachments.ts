"use client";

import type { BudgetAttachment } from "@/lib/planner-budget";

const databaseName = "nxtevnt-budget-files";
const storeName = "attachments";
const allowedExtensions = /\.(pdf|png|jpe?g|webp|gif|docx?|xls|xlsx|xlsm|csv|txt)$/i;

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("File storage is unavailable in this browser.")); return; }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("File storage is unavailable in this browser."));
  });
}

export function validateBudgetAttachment(file: File) {
  if (!allowedExtensions.test(file.name)) return "Use a PDF, image, Word, Excel (including XLSM), CSV or text file.";
  if (file.size === 0) return "This file is empty. Choose another document.";
  if (file.size > 15 * 1024 * 1024) return "Each document must be smaller than 15 MB.";
  return "";
}

export function validateBudgetReceipt(file: File) {
  if (!/\.(pdf|png|jpe?g|webp)$/i.test(file.name) || !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) return "Use a PDF, JPG, PNG or WebP receipt.";
  return validateBudgetAttachment(file);
}

export async function saveBudgetAttachments(files: { attachment: BudgetAttachment; file: File }[]) {
  if (!files.length) return;
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      for (const entry of files) transaction.objectStore(storeName).put(entry.file, entry.attachment.id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("The documents couldn’t be saved in this browser."));
      transaction.onabort = () => reject(new Error("The documents couldn’t be saved in this browser."));
    });
  } finally { db.close(); }
}

export async function getBudgetAttachment(id: string): Promise<Blob | null> {
  const db = await database();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(new Error("This document couldn’t be opened."));
    });
  } finally { db.close(); }
}

export async function deleteBudgetAttachments(ids: string[]) {
  if (!ids.length) return;
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      for (const id of ids) transaction.objectStore(storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Some stored documents couldn’t be removed."));
    });
  } finally { db.close(); }
}
