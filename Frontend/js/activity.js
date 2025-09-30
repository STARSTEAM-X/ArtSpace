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

function renderActivities(list) {
    if (!list || list.length === 0) {
        container.innerHTML = `<p>ไม่มีกิจกรรม</p>`;
        return;
    }

    container.innerHTML = list
        .slice()            // ทำ copy ป้องกันแก้ list ต้นฉบับ
        .reverse()          // พลิก array ให้ item สุดท้ายขึ้นก่อน
        .map(act => `
        <div class="card">
          <span class="tag ${mapTagClass(act.activityType)}">${act.activityType}</span>
          <h3>${act.activityName}</h3>
          <img src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/300x150"}" alt="activity">
          <p><i class="fa fa-map-marker"></i> ${act.location}</p>
          <p><i class="fa fa-calendar"></i> ${formatDate(act.activityDateStart)} - ${formatDate(act.activityDateEnd)}</p>
          <p><i class="fa fa-clock"></i> ${act.activityTimeStart} - ${act.activityTimeEnd}</p>
          <div class="status ${act.currentParticipants < act.maxParticipants ? "success" : "danger"}">
            ${act.currentParticipants}/${act.maxParticipants}
          </div>
          <div class="actions">
            <button class="detail" onclick="viewDetail(${act.id})">More Detail</button>
            <button class="join" onclick="joinActivity(${act.id})">Join Now</button>
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
      <h2>${act.activityName}</h2>
      <img src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/500x250"}" alt="activity">
      <p><strong>รายละเอียด:</strong> ${act.activityDescription || "-"}</p>
      <p><i class="fa fa-map-marker"></i> ${act.location}</p>
      <p><i class="fa fa-calendar"></i> ${formatDate(act.activityDateStart)} - ${formatDate(act.activityDateEnd)}</p>
      <p><i class="fa fa-clock"></i> ${act.activityTimeStart} - ${act.activityTimeEnd}</p>
      <p><strong>ผู้เข้าร่วม:</strong> ${act.cerrentParticipants}/${act.maxParticipants}</p>
      <p><strong>ผู้สร้าง:</strong> ${act.createdByUserName}</p>
      <div style="margin-top:15px; text-align:right;">
        <button class="join" onclick="joinActivity(${act.id})">Join Now</button>
      </div>
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
