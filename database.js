// فتح قاعدة بيانات باسم "TeacherDB"
const DB_NAME = "TeacherDB";
const DB_VERSION = 1;
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("Lessons")) {
        db.createObjectStore("Lessons", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("Exams")) {
        db.createObjectStore("Exams", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject("DB Error: " + event.target.errorCode);
    };
  });
}

function getStore(storeName, mode = "readonly") {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export { openDB, getStore };