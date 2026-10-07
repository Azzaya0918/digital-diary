import { supabase } from './supabase.js';

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');
const btnRegister = document.getElementById('btn-register');

// Хэрэв хэрэглэгч аль хэдийн нэвтэрсэн байвал шууд dashboard руу шилжүүлэх
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) window.location.href = 'dashboard.html';
});

// ==========================================
// 1. НЭВТРЭХ
// ==========================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    messageDiv.className = "text-center small mt-3 fw-medium text-warning";
    messageDiv.textContent = "Түр хүлээнэ үү...";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        messageDiv.className = "text-danger text-center small mt-3 fw-medium";
        messageDiv.textContent = `Алдаа: ${error.message}`;
    } else {
        messageDiv.className = "text-success text-center small mt-3 fw-medium";
        messageDiv.textContent = "Амжилттай нэвтэрлээ! Түр хүлээнэ үү...";
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    }
});

// ==========================================
// 2. БҮРТГҮҮЛЭХ
// ==========================================
btnRegister.addEventListener('click', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        messageDiv.className = "text-danger text-center small mt-3 fw-medium";
        messageDiv.textContent = "Имэйл болон нууц үгээ оруулна уу!";
        return;
    }

    messageDiv.className = "text-center small mt-3 fw-medium text-warning";
    messageDiv.textContent = "Бүртгэж байна...";

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        messageDiv.className = "text-danger text-center small mt-3 fw-medium";
        messageDiv.textContent = `Бүртгэлийн алдаа: ${error.message}`;
    } else {
        messageDiv.className = "text-success text-center small mt-3 fw-medium";
        messageDiv.textContent = "Амжилттай бүртгэгдлээ! Одоо нэвтэрч болно.";
    }
});
