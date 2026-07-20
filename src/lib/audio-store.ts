"use client";

const databaseName = "anbuloop-audio";
const storeName = "clips";

function openStore(mode: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    request.onerror = () => reject(new Error("Browser audio storage is unavailable."));
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => {
      const transaction = request.result.transaction(storeName, mode);
      transaction.onerror = () => reject(new Error("Browser audio storage is unavailable."));
      resolve(transaction.objectStore(storeName));
    };
  });
}

export async function saveLocalAudio(reference: string, audio: Blob) {
  const store = await openStore("readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(audio, reference);
    request.onerror = () => reject(new Error("The recording could not be saved in this browser."));
    request.onsuccess = () => resolve();
  });
}

export async function loadLocalAudio(reference: string) {
  const store = await openStore("readonly");
  return new Promise<Blob | null>((resolve, reject) => {
    const request = store.get(reference);
    request.onerror = () => reject(new Error("The recording could not be read from this browser."));
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
  });
}

export async function deleteLocalAudio(reference?: string) {
  if (!reference) return;
  const store = await openStore("readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(reference);
    request.onerror = () => reject(new Error("The recording could not be deleted from this browser."));
    request.onsuccess = () => resolve();
  });
}

export async function clearLocalAudio() {
  const store = await openStore("readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(new Error("The recordings could not be deleted from this browser."));
    request.onsuccess = () => resolve();
  });
}
