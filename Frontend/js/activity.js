// ====== STATE & ELEMENTS ======
const container = document.getElementById("activitiesContainer");
const modal = document.getElementById("activityModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

const searchInput = document.getElementById("searchInput");
const btnSearch = document.querySelector(".btn-search");
const categoryBtn = document.getElementById("categoryBtn");
const sortBtn = document.getElementById("sortBtn");

let allActivities = [];
let selectedCategory = ""; // Visual Arts / Photography / Writing / Music
let sortBy = "";           // "participants" | "date"

// ====== LOAD & RENDER ======
async function loadActivities() {
    try {
        const res = await fetch(`${BASE_URL}/api/activity/list`);
        if (!res.ok) throw new Error("โหลดกิจกรรมล้มเหลว");
        allActivities = await res.json();
        applyFilters(); // โหลดครั้งแรกก็เรนเดอร์ด้วยเงื่อนไขปัจจุบัน (ว่าง ๆ)
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red;">ไม่สามารถโหลดกิจกรรมได้</p>`;
    }
}
function getactivityTypeIcon(activityType) {
    const iconMap = {
        'Visual Arts': '/ArtSpace/Frontend/img/VisualArts.png',
        'Photography': '/ArtSpace/Frontend/img/photo.png',
        'Writing': '/ArtSpace/Frontend/img/writ.png',
        'Music': '/ArtSpace/Frontend/img/music.png'
    };
    return iconMap[activityType] || '/ArtSpace/Frontend/img/logo.png';
}
function renderActivities(list) {
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <img class="empty-ill" src="/ArtSpace/Frontend/img/notfound.png" alt="">
                <p>ขออภัยไม่มีกิจกรรมที่คุณค้นหาในตอนนี้</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list
        .slice()            // ทำ copy ป้องกันแก้ list ต้นฉบับ
        .reverse()          // พลิก array ให้ item สุดท้ายขึ้นก่อน
        .map(act => `
            <div class="card-body">
                <span class="pill-head tag${mapTagClass(act.activityType)}"><img src="${getactivityTypeIcon(act.activityType)}" alt="" width="16" height="auto"> ${act.activityType}</span>
                <div class="title-head">${act.activityName}</div>
                <img class="cover" src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/300x150"}" alt="">
                <div class="info-stack">
                    <div class="info-row"><img src="/ArtSpace/Frontend/img/position.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${act.location}</div></div>
                    <div class="info-row"><img src="/ArtSpace/Frontend/img/calendar.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${formatDate(act.activityDateStart)} - ${formatDate(act.activityDateEnd)}</div></div>
                    <div class="info-row"><img src="/ArtSpace/Frontend/img/time.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${act.activityTimeStart} - ${act.activityTimeEnd}</div></div>
                </div>
                <div class="count-badge status ${act.currentParticipants < act.maxParticipants ? "success" : "danger"}"><img class="image-count-badge" src="/ArtSpace/Frontend/img/account.png" width="18" height="18" alt=""> ${act.currentParticipants}/${act.maxParticipants}</div>     
                <div class="org">
                    <img class="btn-img" src="${BASE_URL + act.createdBy.profileImg}" alt="" onclick="viewProfile(${act.id})">
                    <div>ไอดีผู้จัดกิจกรรม<br>${act.createdBy.nickname} · ${act.createdBy.averageScore} </div>
                </div>
                <div class="actions-cardAct">
                    <button class="btn btn-small btn-ghost detail" onclick="viewDetail(${act.id})" >More Detail</button>
                    <button class="btn btn-small btn-dark btn-join join" onclick="joinActivity(${act.id})">Join Now</button>
                </div>
            </div>
      `).join("");
}


// ====== FILTER / SORT / SEARCH ======
function applyFilters() {
    let list = [...allActivities];

    // คำค้น
    const kw = (searchInput.value || "").trim().toLowerCase();
    if (kw) {
        list = list.filter(a =>
            (a.activityName || "").toLowerCase().includes(kw) ||
            (a.createdByUserName || "").toLowerCase().includes(kw)
        );
    }

    // หมวดหมู่
    if (selectedCategory) {
        list = list.filter(a => (a.activityType || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // เรียงลำดับ
    if (sortBy === "participants") {
        list.sort((a, b) => (b.currentParticipants - a.currentParticipants));
    } else if (sortBy === "date") {
        list.sort((a, b) => new Date(a.activityDateStart) - new Date(b.activityDateStart));
    }

    renderActivities(list);
}

// ====== MODAL DETAIL ======
async function viewDetail(id) {
    try {
        const res = await fetch(`${BASE_URL}/api/activity/detail/${id}`);
        if (!res.ok) throw new Error("โหลดรายละเอียดกิจกรรมล้มเหลว");
        const act = await res.json();

        modalBody.innerHTML = `
            <h2 class="category">${act.activityType}</h2>
            <img src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/500x250"}" alt="Activity" class="activity-image">
        
            <div class="info-box">
                <span class="info-label">ชื่อกิจกรรม :</span>
                <span class="info-value">${act.activityName}</span>
            </div>

            <div class="info-box">
                <span class="info-label">รายละเอียด :</span>
                <span class="info-value">${act.activityDescription || "-"}</span>
            </div>

            <div class="info-box">
                <span class="info-label">วันที่เริ่มจัดกิจกรรม :</span>
                <div class="datetime-row">
                    <input type="date" class="date-input" value="${formatDate(act.activityDateStart)}" readonly>
                    <input type="time" class="time-input" value="${act.activityTimeStart}" readonly>
                </div>
            </div>

            <div class="info-box">
                <span class="info-label">วันที่สิ้นสุดกิจกรรม :</span>
                <div class="datetime-row">
                    <input type="date" class="date-input" value="${formatDate(act.activityDateEnd)}" readonly>
                    <input type="time" class="time-input" value="${act.activityTimeEnd}" readonly>
                </div>
            </div>

            <div class="info-box">
                <span class="info-label">สถานที่ :</span>
                <span class="info-value">${act.location}</span>
            </div>

            <div class="info-box participant">
                <span class="info-label">จำนวนที่รับ :</span>
                <div class="datetime-row">
                    <input type="number" class="capacity-input chip" value="${act.maxParticipants}" readonly>
                    <span class="capacity-note note-right">เข้าร่วมแล้ว ${act.currentParticipants || "ไม่มี"} คน</span>
                </div>
            </div>

            <div class="info-box">
                <span class="info-label">วันหมดอายุของประกาศ :</span>
                <div class="datetime-row">
                    <input type="date" class="date-input" value="${act.deadline} " readonly>
                    <input type="time" class="time-input" value="${act.deadlineTime}" readonly>
                </div>
            </div>
            <div class="info-box organizer-row">
                <span class="info-label">ผู้จัด :</span>
                <span class="info-value organizer-name">${act.createdByUserName} · ${act.rating} </span>
            </div>
            <button class="join" onclick="joinActivity(${act.id})">Join Now</button>
            `;
        modal.style.display = "flex";
    } catch (err) {
        console.error(err);
        alert("ไม่สามารถโหลดรายละเอียดได้");
    }
}

// ====== JOIN ======
async function joinActivity(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม");
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/api/activity/join`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ activityId: id })
        });
        const data = await res.json();
        if (res.ok) {
            alert("เข้าร่วมกิจกรรมสำเร็จ");
            await loadActivities(); // รีโหลดข้อมูลให้ตัวเลขผู้เข้าร่วมอัปเดต
        } else {
            alert("ไม่สามารถเข้าร่วม: " + (data.message || "unknown"));
        }
    } catch (err) {
        console.error(err);
    }
}

// ====== DROPDOWN: เปิด-ปิดด้วยคลิก & เลือกแล้วปิดทันที ======
document.querySelectorAll(".dropdown .dropbtn").forEach(btn => {
    btn.addEventListener("click", e => {
        e.stopPropagation();
        const parent = btn.parentElement;
        document.querySelectorAll(".dropdown").forEach(d => {
            if (d !== parent) d.classList.remove("open");
        });
        parent.classList.toggle("open");
    });
});

// เลือก "หมวดหมู่"
document.querySelectorAll(".dropdown .dropdown-content .tag").forEach(item => {
    item.addEventListener("click", e => {
        const parent = item.closest(".dropdown");
        parent.classList.remove("open");

        // ชื่อหมวดหมู่ (ตัดช่องว่าง/ไอคอน)
        const cat = item.innerText.trim();
        // toggle: กดซ้ำ = ล้างตัวกรอง
        if (selectedCategory === cat) {
            selectedCategory = "";
            categoryBtn.textContent = "หมวดหมู่ ▾";
        } else {
            selectedCategory = cat;
            categoryBtn.textContent = cat;
        }
        applyFilters();
    });
});

// เลือก "เรียงลำดับ"
(() => {
    const sortDropdown = sortBtn.parentElement;
    sortDropdown.querySelectorAll(".dropdown-content button:not(.tag)").forEach(item => {
        item.addEventListener("click", e => {
            sortDropdown.classList.remove("open");

            const label = item.innerText.trim();
            sortBtn.textContent = label;

            sortBy = label.includes("ผู้เข้าร่วม") ? "participants" : "date";
            applyFilters();
        });
    });
})();

// ปิด dropdown เมื่อคลิกนอก
window.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
});

// ====== SEARCH EVENTS ======
btnSearch.addEventListener("click", applyFilters);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") applyFilters(); });

// ====== HELPERS ======
function mapTagClass(type) {
    switch (type) {
        case "Visual Arts": return "visual";
        case "Music": return "music";
        case "Photography": return "photo";
        case "Writing": return "writing";
        default: return "other";
    }
}
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", loadActivities);
// ปิด modal
modalClose.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });


// ===== HERO BUTTONS =====
const btnFind = document.getElementById("btnFind");
const btnCreate = document.getElementById("btnCreate");
const searchBar = document.querySelector(".search-bar");
const createModal = document.getElementById("createModal");
const createClose = document.getElementById("createClose");

// Find Activity → scroll ไป Search Bar
btnFind?.addEventListener("click", () => {
    searchBar.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Create Activity → เปิด modal
btnCreate?.addEventListener("click", () => {
    createModal.style.display = "flex";
});

// ปิด modal สร้างกิจกรรม
createClose?.addEventListener("click", () => {
    createModal.style.display = "none";
});
window.addEventListener("click", e => {
    if (e.target === createModal) {
        createModal.style.display = "none";
    }
});

// ====== CREATE ACTIVITY ======
const createForm = document.getElementById("createActivityForm");

createForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม");
        return;
    }

    const formData = new FormData(createForm);

    try {
        const res = await fetch(`${BASE_URL}/api/activity/createactivity`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }, // ❗ ต้องมี token
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            alert("สร้างกิจกรรมสำเร็จ!");
            createForm.reset();
            createModal.style.display = "none";
            await loadActivities(); // refresh list ให้เห็นกิจกรรมใหม่
        } else {
            alert("สร้างกิจกรรมไม่สำเร็จ: " + (data.message || "unknown error"));
        }
    } catch (err) {
        console.error("Error creating activity:", err);
        alert("เกิดข้อผิดพลาด ไม่สามารถสร้างกิจกรรมได้");
    }
});
