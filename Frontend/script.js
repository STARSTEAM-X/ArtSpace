
// ตัวอย่างข้อมูลเริ่มต้น (mock)
const data = [
    { id: 1, title: 'Morning Fog', desc: 'ถ่ายจากริมทะเลสาบในเช้าวันฝนพรำ', tags: ['landscape', 'photography'], src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=60' },
    { id: 2, title: 'Color Burst', desc: 'งานกราฟิกคอลลาจเนื้อสีสด', tags: ['digital', 'art'], src: 'https://images.unsplash.com/photo-1495433324511-bf8e92934d90?w=1200&q=60' },
    { id: 3, title: 'Quiet Alley', desc: 'ตรอกเล็กๆ ในเมืองเก่า', tags: ['street', 'photography'], src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=60' },
    { id: 4, title: 'Abstract Circles', desc: 'ทดลองเล่นรูปทรงกับสีและแสง', tags: ['abstract', 'digital'], src: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1200&q=60' },
    { id: 5, title: 'Mountain Pass', desc: 'เส้นทางขึ้นเขาในฤดูใบไม้ร่วง', tags: ['landscape', 'photography'], src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=60' }
];

// State
let items = [...data];
let activeTag = null;
let currentIndex = 0;

// Elements
const gallery = document.getElementById('gallery');
const categories = document.getElementById('categories');
const tpl = document.getElementById('cardTpl');
const q = document.getElementById('q');
const sort = document.getElementById('sort');
const count = document.getElementById('count');
const viewer = document.getElementById('viewer');
const viewImg = document.getElementById('viewImg');
const viewTitle = document.getElementById('viewTitle');
const viewDesc = document.getElementById('viewDesc');
const viewTags = document.getElementById('viewTags');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const closeBtn = document.getElementById('close');
const uploadBtn = document.getElementById('uploadBtn');

// สร้างรายการเริ่มต้น
function init() {
    renderCategories();
    renderGallery(items);
    attachEvents();
}

function uniqueTags() {
    const s = new Set();
    items.forEach(i => i.tags.forEach(t => s.add(t)));
    return Array.from(s).sort();
}

function renderCategories() {
    const tags = uniqueTags();
    categories.innerHTML = '';
    const all = document.createElement('div');
    all.className = 'tag ' + (activeTag === null ? 'active' : '');
    all.textContent = 'ทั้งหมด';
    all.onclick = () => { activeTag = null; renderGallery(items); renderCategories() };
    categories.appendChild(all);
    tags.forEach(t => {
        const el = document.createElement('div');
        el.className = 'tag ' + (activeTag === t ? 'active' : '');
        el.textContent = t;
        el.onclick = () => { activeTag = (activeTag === t ? null : t); renderGallery(items); renderCategories() };
        categories.appendChild(el);
    });
}

function filterAndSearch() {
    let list = [...items];
    const qv = q.value.trim().toLowerCase();
    if (activeTag) { list = list.filter(i => i.tags.includes(activeTag)); }
    if (qv) { list = list.filter(i => (i.title + ' ' + i.desc).toLowerCase().includes(qv)); }
    // sort
    const s = sort.value;
    if (s === 'new') list.sort((a, b) => b.id - a.id);
    else if (s === 'old') list.sort((a, b) => a.id - b.id);
    else if (s === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
}

function renderGallery(source) {
    const list = filterAndSearch();
    gallery.innerHTML = '';
    if (list.length === 0) { gallery.innerHTML = '<div style="grid-column:1/-1;padding:36px;text-align:center;color:#9fb0c8">ไม่พบผลงาน</div>'; }
    list.forEach((it, idx) => {
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector('.card');
        const img = node.querySelector('.thumb');
        const h3 = node.querySelector('h3');
        const p = node.querySelector('p');
        const tagWrap = node.querySelector('.tags');
        img.src = it.src;
        img.alt = it.title;
        h3.textContent = it.title;
        p.textContent = it.desc;
        it.tags.forEach(t => { const el = document.createElement('div'); el.className = 'tag'; el.textContent = t; el.onclick = (e) => { e.stopPropagation(); activeTag = t; renderCategories(); renderGallery(items); }; tagWrap.appendChild(el); });
        card.onclick = () => { openViewer(list, idx); };
        gallery.appendChild(node);
    });
    count.textContent = list.length;
}

// Viewer control
function openViewer(list, idx) {
    currentIndex = idx;
    const it = list[idx];
    viewImg.src = it.src;
    viewTitle.textContent = it.title;
    viewDesc.textContent = it.desc;
    viewTags.innerHTML = '';
    it.tags.forEach(t => { const el = document.createElement('div'); el.className = 'tag'; el.textContent = t; viewTags.appendChild(el); });
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
}

function closeViewer() { viewer.classList.remove('open'); viewer.setAttribute('aria-hidden', 'true'); }

prevBtn.onclick = () => {
    const list = filterAndSearch();
    currentIndex = (currentIndex - 1 + list.length) % list.length;
    openViewer(list, currentIndex);
};
nextBtn.onclick = () => {
    const list = filterAndSearch();
    currentIndex = (currentIndex + 1) % list.length;
    openViewer(list, currentIndex);
};
closeBtn.onclick = closeViewer;
viewer.onclick = (e) => { if (e.target === viewer) closeViewer(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowLeft') prevBtn.click(); if (e.key === 'ArrowRight') nextBtn.click(); });

function attachEvents() {
    q.addEventListener('input', () => renderGallery(items));
    sort.addEventListener('change', () => renderGallery(items));

    // Upload simulation: เพิ่มรูปตัวอย่างจาก URL prompt
    uploadBtn.addEventListener('click', () => {
        const url = prompt('วาง URL รูปภาพ (ตัวอย่าง: https://...jpg)');
        if (!url) return;
        const t = prompt('ใส่ชื่อผลงาน');
        const d = prompt('คำอธิบายสั้น ๆ');
        const tags = prompt('ใส่แท็กคั่นด้วยคอมม่า (เช่น photography,landscape)') || '';
        const newItem = { id: Date.now(), title: t || 'Untitled', desc: d || '', tags: tags.split(',').map(s => s.trim()).filter(Boolean), src: url };
        items.unshift(newItem);
        renderCategories(); renderGallery(items);
    });
}

// เรียกเริ่มต้น
init();