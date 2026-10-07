import { supabase } from './supabase.js';

const IMAGE_BUCKET = 'diary-images';

// ---------- Элементүүд ----------
const entryForm = document.getElementById('entry-form');
const entryDateInput = document.getElementById('entry-date');
const entryTitleInput = document.getElementById('entry-title');
const entryContentInput = document.getElementById('entry-content');
const entryImageInput = document.getElementById('entry-image');
const entryMoodInput = document.getElementById('entry-mood');
const imagePreview = document.getElementById('image-preview');

const entriesList = document.getElementById('entries-list');
const viewCardsBtn = document.getElementById('view-cards-btn');
const viewCalendarBtn = document.getElementById('view-calendar-btn');
const cardsView = document.getElementById('cards-view');
const calendarView = document.getElementById('calendar-view');

const editForm = document.getElementById('edit-entry-form');
const editModalEl = document.getElementById('editModal');
const editModal = new bootstrap.Modal(editModalEl);

let currentUser = null;
let allEntries = [];
let calendarCursor = new Date(); // сар хөтлөхөд ашиглана

// ---------- Эхлэл ----------
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    document.getElementById('user-email').textContent = user.email;
    entryDateInput.value = new Date().toISOString().slice(0, 10);

    document.getElementById('btn-logout').addEventListener('click', async () => {
        const confirmed = confirm('Та гарахдаа итгэлтэй байна уу?');
        if (!confirmed) return;
        
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    await fetchEntries();
});

// ---------- Mood сонгох (шинэ тэмдэглэл) ----------
document.getElementById('mood-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll('#mood-picker .mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    entryMoodInput.value = btn.dataset.mood;
});

// ---------- Mood сонгох (засах Modal) ----------
document.getElementById('edit-mood-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll('#edit-mood-picker .mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('edit-mood-value').value = btn.dataset.mood;
});

// ---------- Зургийн урьдчилсан харагдац ----------
entryImageInput.addEventListener('change', () => {
    const file = entryImageInput.files[0];
    if (!file) { imagePreview.classList.add('d-none'); return; }
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.classList.remove('d-none');
});

// ---------- Харагдац сэлгэх (Карт / Хуанли) ----------
viewCardsBtn.addEventListener('click', () => {
    viewCardsBtn.classList.add('active');
    viewCalendarBtn.classList.remove('active');
    cardsView.classList.remove('d-none');
    calendarView.classList.add('d-none');
});
viewCalendarBtn.addEventListener('click', () => {
    viewCalendarBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    calendarView.classList.remove('d-none');
    cardsView.classList.add('d-none');
    renderCalendar();
});

// ---------- Зураг Storage руу хуулах ----------
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Зураг хуулахад алдаа гарлаа:', uploadError.message);
        return null;
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// ---------- Шинэ тэмдэглэл нэмэх ----------
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!entryMoodInput.value) {
        alert('Сэтгэл хөдлөлөө сонгоно уу!');
        return;
    }

    const submitBtn = entryForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Хадгалж байна...';

    let imageUrl = null;
    const file = entryImageInput.files[0];
    if (file) {
        imageUrl = await uploadImage(file);
    }

    const { error } = await supabase
        .from('diary_entries')
        .insert([{
            user_id: currentUser.id,
            entry_date: entryDateInput.value,
            mood: entryMoodInput.value,
            title: entryTitleInput.value.trim(),
            content: entryContentInput.value.trim(),
            image_url: imageUrl
        }]);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-plus me-1"></i> Тэмдэглэл хадгалах';

    if (error) {
        alert('Тэмдэглэл хадгалахад алдаа гарлаа: ' + error.message);
        return;
    }

    entryForm.reset();
    entryDateInput.value = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('#mood-picker .mood-btn').forEach(b => b.classList.remove('active'));
    entryMoodInput.value = '';
    imagePreview.classList.add('d-none');

    await fetchEntries();
});

// ---------- Тэмдэглэлүүдийг уншиж авах ----------
async function fetchEntries() {
    const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Тэмдэглэл уншихад алдаа гарлаа:', error.message);
        return;
    }

    allEntries = data || [];
    renderEntries(allEntries);
    if (!calendarView.classList.contains('d-none')) renderCalendar();
}

// ---------- Карт хэлбэрээр харуулах ----------
function renderEntries(entries) {
    if (entries.length === 0) {
        entriesList.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="fa-solid fa-feather fs-2 d-block mb-2"></i>
                Одоогоор тэмдэглэл байхгүй байна. Эхний тэмдэглэлээ бичээрэй!
            </div>`;
        return;
    }

    entriesList.innerHTML = entries.map(entry => `
        <div class="col-md-6">
            <div class="card entry-card h-100">
                ${entry.image_url ? `<img src="${entry.image_url}" class="entry-img" alt="">` : ''}
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="entry-mood-badge">${entry.mood}</span>
                        <span class="small text-muted">${formatDate(entry.entry_date)}</span>
                    </div>
                    ${entry.title ? `<h6 class="fw-bold mb-1">${escapeHtml(entry.title)}</h6>` : ''}
                    <p class="small text-secondary mb-2" style="white-space:pre-wrap;">${escapeHtml(entry.content)}</p>
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.openEditModal('${entry.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteEntry('${entry.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ---------- Тэмдэглэл устгах ----------
window.deleteEntry = async function (id) {
    if (!confirm('Та энэ тэмдэглэлийг устгахдаа итгэлтэй байна уу?')) return;

    const entry = allEntries.find(e => e.id === id);

    const { error } = await supabase.from('diary_entries').delete().eq('id', id);
    if (error) {
        alert('Устгахад алдаа гарлаа: ' + error.message);
        return;
    }

    // Хэрэв зурагтай байсан бол Storage-с мөн устгах
    if (entry && entry.image_url) {
        const path = entry.image_url.split(`${IMAGE_BUCKET}/`)[1];
        if (path) await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    }

    await fetchEntries();
};

// ---------- Тэмдэглэл засах Modal нээх ----------
window.openEditModal = function (id) {
    const entry = allEntries.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('edit-id').value = entry.id;
    document.getElementById('edit-date').value = entry.entry_date;
    document.getElementById('edit-title').value = entry.title || '';
    document.getElementById('edit-content').value = entry.content;

    document.querySelectorAll('#edit-mood-picker .mood-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mood === entry.mood);
    });
    document.getElementById('edit-mood-value').value = entry.mood;

    editModal.show();
};

// ---------- Тэмдэглэл засах хадгалах ----------
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const moodValue = document.getElementById('edit-mood-value').value;

    if (!moodValue) {
        alert('Сэтгэл хөдлөлөө сонгоно уу!');
        return;
    }

    const { error } = await supabase
        .from('diary_entries')
        .update({
            entry_date: document.getElementById('edit-date').value,
            mood: moodValue,
            title: document.getElementById('edit-title').value.trim(),
            content: document.getElementById('edit-content').value.trim()
        })
        .eq('id', id);

    if (error) {
        alert('Шинэчлэхэд алдаа гарлаа: ' + error.message);
        return;
    }

    editModal.hide();
    await fetchEntries();
});

// ---------- Хуанли харагдац ----------
function renderCalendar() {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();

    const monthNames = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
        '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];
    document.getElementById('cal-month-label').textContent = `${monthNames[month]}, ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const entriesByDate = {};
    allEntries.forEach(e => {
        entriesByDate[e.entry_date] = entriesByDate[e.entry_date] || [];
        entriesByDate[e.entry_date].push(e);
    });

    const calDays = document.getElementById('calendar-days');
    let html = '';

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEntries = entriesByDate[dateStr];
        const hasEntry = !!dayEntries;
        html += `
            <div class="calendar-day ${hasEntry ? 'has-entry' : ''}" data-date="${dateStr}">
                <span>${d}</span>
                ${hasEntry ? `<span class="day-mood">${dayEntries[0].mood}</span>` : ''}
            </div>`;
    }

    calDays.innerHTML = html;

    calDays.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            calDays.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
            showEntriesForDate(dayEl.dataset.date, entriesByDate[dayEl.dataset.date] || []);
        });
    });

    document.getElementById('calendar-day-entries').innerHTML =
        `<p class="text-muted small text-center py-3">Тэмдэглэл харахын тулд хуанли дээрх өдрийг сонгоно уу.</p>`;
}

function showEntriesForDate(dateStr, entries) {
    const container = document.getElementById('calendar-day-entries');
    if (entries.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center py-3">${formatDate(dateStr)} өдөрт тэмдэглэл алга.</p>`;
        return;
    }
    container.innerHTML = `<h6 class="fw-bold mb-2">${formatDate(dateStr)}</h6>` + entries.map(entry => `
        <div class="card entry-card mb-2">
            ${entry.image_url ? `<img src="${entry.image_url}" class="entry-img" alt="">` : ''}
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <span class="entry-mood-badge">${entry.mood}</span>
                </div>
                ${entry.title ? `<h6 class="fw-bold mb-1">${escapeHtml(entry.title)}</h6>` : ''}
                <p class="small text-secondary mb-2" style="white-space:pre-wrap;">${escapeHtml(entry.content)}</p>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.openEditModal('${entry.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.deleteEntry('${entry.id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

document.getElementById('cal-prev').addEventListener('click', () => {
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    renderCalendar();
});

// ---------- Туслах функцууд ----------
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
