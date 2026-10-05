import { openDB, getStore } from "./database.js";

async function addExam(exam) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Exams", "readwrite");
    const request = store.add(exam);
    request.onsuccess = () => resolve("Exam added successfully");
    request.onerror = () => reject("Error adding exam");
  });
}

async function getExams() {
  await openDB();
  return new Promise((resolve) => {
    const store = getStore("Exams");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

async function updateExam(id, updatedExam) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Exams", "readwrite");
    const request = store.put({ ...updatedExam, id });
    request.onsuccess = () => resolve("Exam updated");
    request.onerror = () => reject("Error updating exam");
  });
}

async function deleteExam(id) {
  await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore("Exams", "readwrite");
    const request = store.delete(id);
    request.onsuccess = () => resolve("Exam deleted");
    request.onerror = () => reject("Error deleting exam");
  });
}

export { addExam, getExams, updateExam, deleteExam };