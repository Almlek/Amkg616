import { openDB, getStore } from "./database.js";

async function addLesson(lesson) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Lessons", "readwrite");
    const request = store.add(lesson);
    request.onsuccess = () => resolve("Lesson added successfully");
    request.onerror = () => reject("Error adding lesson");
  });
}

async function getLessons() {
  await openDB();
  return new Promise((resolve) => {
    const store = getStore("Lessons");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

async function updateLesson(id, updatedLesson) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Lessons", "readwrite");
    const request = store.put({ ...updatedLesson, id });
    request.onsuccess = () => resolve("Lesson updated");
    request.onerror = () => reject("Error updating lesson");
  });
}

async function deleteLesson(id) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Lessons", "readwrite");
    const request = store.delete(id);
    request.onsuccess = () => resolve("Lesson deleted");
    request.onerror = () => reject("Error deleting lesson");
  });
}

export { addLesson, getLessons, updateLesson, deleteLesson };