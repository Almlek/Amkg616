import { addLesson, getLessons, updateLesson, deleteLesson } from "./lesson-agent.js";
import { addExam, getExams, updateExam, deleteExam } from "./exam-agent.js";

// دالة لعرض الدروس في واجهة HTML
async function renderLessons() {
  const lessons = await getLessons();
  const container = document.getElementById("lessons-container");
  container.innerHTML = "";
  lessons.forEach(lesson => {
    const div = document.createElement("div");
    div.className = "lesson-item";
    div.innerHTML = `
      <h3>${lesson.title}</h3>
      <p>${lesson.description}</p>
      <button onclick="editLesson(${lesson.id})">تعديل</button>
      <button onclick="removeLesson(${lesson.id})">حذف</button>
    `;
    container.appendChild(div);
  });
}

// دالة لعرض الامتحانات في واجهة HTML
async function renderExams() {
  const exams = await getExams();
  const container = document.getElementById("exams-container");
  container.innerHTML = "";
  exams.forEach(exam => {
    const div = document.createElement("div");
    div.className = "exam-item";
    div.innerHTML = `
      <h3>${exam.title}</h3>
      <p>عدد الأسئلة: ${exam.questions?.length || 0}</p>
      <button onclick="editExam(${exam.id})">تعديل</button>
      <button onclick="removeExam(${exam.id})">حذف</button>
    `;
    container.appendChild(div);
  });
}

// إضافة درس جديد
async function createLesson() {
  const title = document.getElementById("lesson-title").value;
  const description = document.getElementById("lesson-description").value;
  await addLesson({ title, description });
  await renderLessons();
}

// إضافة امتحان جديد
async function createExam() {
  const title = document.getElementById("exam-title").value;
  await addExam({ title, questions: [] });
  await renderExams();
}

// تعديل درس
async function editLesson(id) {
  const newTitle = prompt("أدخل عنوان الدرس الجديد:");
  const newDescription = prompt("أدخل وصف الدرس الجديد:");
  await updateLesson(id, { title: newTitle, description: newDescription });
  await renderLessons();
}

// حذف درس
async function removeLesson(id) {
  await deleteLesson(id);
  await renderLessons();
}

// تعديل امتحان
async function editExam(id) {
  const newTitle = prompt("أدخل عنوان الامتحان الجديد:");
  await updateExam(id, { title: newTitle });
  await renderExams();
}

// حذف امتحان
async function removeExam(id) {
  await deleteExam(id);
  await renderExams();
}

// تحميل البيانات عند فتح الصفحة
window.onload = async () => {
  await renderLessons();
  await renderExams();
};

export { createLesson, createExam };