import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// KONFIGURASI SUPABASE
// =====================================================
const supabaseUrl = 'https://rvmudctouodmcgezyeeh.supabase.co'; // Dihapus '/rest/v1/' agar tidak error
const supabaseKey = 'sb_publishable_q6uBEZNhxhOuza2VJCmJZQ_dHhBgw3D';

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// INISIALISASI HALAMAN
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode();
    await loadProjects();
    initContactForm();
});

// =====================================================
// DARK MODE
// =====================================================
function initDarkMode() {
    const themeToggleBtn = document.getElementById('theme-toggle') || document.getElementById('toggleTheme');
    if (!themeToggleBtn) return;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    updateThemeButton(themeToggleBtn);

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeButton(themeToggleBtn);
    });
}

function updateThemeButton(btn) {
    const isDark = document.body.classList.contains('dark-mode');
    btn.textContent = isDark ? '🌞 Light Mode' : '🌛 Dark Mode';
}

// =====================================================
// LOAD PROYEK DARI SUPABASE
// =====================================================
async function loadProjects() {
    const container = document.getElementById('proyek-container');
    if (!container) {
        console.error('ERROR: #proyek-container tidak ditemukan');
        return;
    }

    const { data: proyek, error } = await supabase
        .from('proyek')
        .select('*')
        .order('created_at', { ascending: false });

    console.log('DATA DARI SUPABASE:', proyek);
    console.log('ERROR DATABASE:', error);

    if (error) {
        console.error('Gagal mengambil proyek:', error.message);
        container.innerHTML = `<p>Gagal mengambil data proyek: ${error.message}</p>`;
        return;
    }

    if (!proyek || proyek.length === 0) {
        container.innerHTML = '<p>Belum ada proyek.</p>';
        return;
    }

    container.innerHTML = '';

    proyek.forEach((item) => {
        let gambarUrl = '';

        if (item.gambar_url) {
            let namaFile = item.gambar_url.trim();

            // Ekstrak nama file jika di database tersimpan URL lengkap
            if (namaFile.startsWith('http://') || namaFile.startsWith('https://')) {
                try {
                    const url = new URL(namaFile);
                    const bagian = url.pathname.split('/storage/v1/object/public/Dhenia/')[1];
                    if (bagian) {
                        namaFile = decodeURIComponent(bagian);
                    }
                } catch (e) {
                    console.error('URL gambar tidak valid:', namaFile);
                }
            }

            // Ambil URL Publik dari Storage 'Dhenia'
            const { data: publicUrlData } = supabase.storage
                .from('Dhenia')
                .getPublicUrl(namaFile);

            gambarUrl = publicUrlData.publicUrl;

            console.log('--- LOG PROYEK ---');
            console.log('PROYEK:', item.judul);
            console.log('DATABASE gambar_url:', item.gambar_url);
            console.log('NAMA FILE:', namaFile);
            console.log('URL GAMBAR:', gambarUrl);
        }

        // Buat Card Element
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '20px';

        card.innerHTML = `
            ${gambarUrl 
                ? `<img src="${gambarUrl}" alt="${item.judul}" class="project-image">` 
                : `<p>Gambar belum tersedia.</p>`
            }
            <h3>${item.judul}</h3>
            <p>${item.deskripsi}</p>
        `;

        // Handling Error Jika Gambar 404
        const img = card.querySelector('.project-image');
        if (img) {
            img.addEventListener('error', () => {
                console.error('GAMBAR 404:', img.src);
                img.style.display = 'none';

                const pesan = document.createElement('p');
                pesan.textContent = '❌ File gambar tidak ditemukan di Storage Dhenia.';
                card.insertBefore(pesan, img.nextSibling);
            });
        }

        container.appendChild(card);
    });
}

// =====================================================
// FORM KONTAK
// =====================================================
function initContactForm() {
    const contactForm = document.querySelector('#contactForm');
    const nameInput = document.querySelector('#namaInput');
    const alertBox = document.querySelector('#alertBox');

    if (!contactForm || !nameInput) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameValue = nameInput.value.trim();

        if (nameValue === '') {
            showAlert(alertBox, '⚠️ Nama wajib diisi!', 'error');
            return;
        }

        const { error } = await supabase
            .from('pesan')
            .insert([{ nama: nameValue }]);

        if (error) {
            console.error('Error Supabase:', error.message);
            showAlert(alertBox, '❌ Gagal mengirim pesan ke server', 'error');
        } else {
            showAlert(alertBox, `✔ Pesan terkirim, ${nameValue}!`, 'success');
            nameInput.value = '';
        }
    });
}

// =====================================================
// HELPER ALERT
// =====================================================
function showAlert(alertBox, message, type) {
    if (alertBox) {
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    } else {
        alert(message);
    }
}