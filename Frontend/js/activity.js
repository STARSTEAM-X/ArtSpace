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
        'Visual Arts': '/img/VisualArts.png',
        'Photography': '/img/photo.png',
        'Writing': '/img/writ.png',
        'Music': '/img/music.png'
    };
    return iconMap[activityType] || '/img/logo.png';
}
function mapTagClass(type) {
    switch (type) {
        case "Visual Arts": return "visual";
        case "Music": return "music";
        case "Photography": return "photo";
        case "Writing": return "writing";
        default: return "other";
    }
}
function renderActivities(list) {
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <img class="empty-ill" src="/img/notfound.png" alt="">
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
                <span class="pill-head ${mapTagClass(act.activityType)}">
                    <img src="${getactivityTypeIcon(act.activityType)}" alt="" width="16">
                    ${act.activityType}
                </span>

                <div class="title-head ${mapTagClass(act.activityType)}">
                    ${act.activityName}
                </div>
                <img class="cover" src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/300x150"}" alt="">
                <div class="info-stack">
                    <div class="info-row"><img src="/img/position.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${act.location}</div></div>
                    <div class="info-row"><img src="/img/calendar.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${formatDate(act.activityDateStart)} - ${formatDate(act.activityDateEnd)}</div></div>
                    <div class="info-row"><img src="/img/time.png" class="info-row-image" width="auto" height="20" alt=""><div class="info-chip">${act.activityTimeStart} - ${act.activityTimeEnd}</div></div>
                </div>
                <div class="count-badge status ${act.currentParticipants < act.maxParticipants ? "success" : "danger"}"><img class="image-count-badge" src="/img/account.png" width="18" height="18" alt=""> ${act.currentParticipants}/${act.maxParticipants}</div>     
                <div class="org">
                    <img class="btn-img" src="${BASE_URL + act.createdBy.profileImg}" alt="" onclick="viewProfile(${act.id})">
                    <div>
                        ${act.createdBy.nickname} 
                        <div>
                            ${act.createdBy.averageScore}
                            <div class="rating" data-score="${act.createdBy.averageScore}"></div>
                        </div> 
                    </div>
                </div>
                <div class="actions-cardAct">
                    <button class="btn btn-small btn-ghost detail" onclick="viewDetail(${act.id})" >More Detail</button>
                    <button class="btn btn-small btn-dark btn-join join" onclick="joinActivity(${act.id})">Join Now</button>
                </div>
            </div>
      `).join("");
    renderStars();
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

    // เรทติ้ง
    if (sortBy === "rating") {
        const score = x => Number(x?.createdBy?.averageScore) || 0;
        list.sort((a,b) => score(a) - score(b));
    }

    renderActivities(list);
}

// ====== MODAL DETAIL ======
function getCurrentUserId() {
    try {
        // ตรวจสอบจาก localStorage หลายรูปแบบ
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            // ลองหาจากหลาย field ที่เป็นไปได้
            return String(user.id || user.userId || user.uid || user._id || "");
        }
        // ถ้าไม่มี user object ลองหาจาก userId โดยตรง
        return String(localStorage.getItem("userId") || "");
    } catch (err) {
        console.error("Error getting user ID:", err);
        return "";
    }
}

// ====== ปรับปรุงฟังก์ชัน viewDetail ======
async function viewDetail(id) {
    try {
        const res = await fetch(`${BASE_URL}/api/activity/detail/${id}`);
        if (!res.ok) throw new Error("โหลดรายละเอียดกิจกรรมล้มเหลว");
        const act = await res.json();

        // Debug: แสดงข้อมูลเพื่อตรวจสอบ
        console.log("Activity detail:", act);
        console.log("Current user ID:", getCurrentUserId());
        console.log("Activity owner:", act.createdBy);

        // ดึง ID ของผู้ใช้ปัจจุบัน
        const currentUserId = getCurrentUserId();
        
        // ดึง ID ของเจ้าของกิจกรรม (ลองหลายรูปแบบ)
        let ownerId = "";
        if (act.createdBy) {
            ownerId = String(
                act.createdBy.id || 
                act.createdBy.userId || 
                act.createdBy._id || 
                act.createdBy.uid || 
                ""
            );
        }

        // ตรวจสอบว่าเป็นเจ้าของกิจกรรมหรือไม่
        const isOwner = currentUserId && ownerId && currentUserId === ownerId;
        
        // ตรวจสอบว่าเข้าร่วมกิจกรรมแล้วหรือไม่
        const isJoined = act.isJoined || false;

        console.log("Is owner:", isOwner);
        console.log("Is joined:", isJoined);

        // กำหนด class สำหรับ badge ผู้เข้าร่วม
        const participantClass = isJoined ? "participants-joined" : "participants-not-joined";

        // สร้างปุ่ม action ตามสถานะ
        let actionHtml = "";
        
        if (isOwner) {
            // เจ้าของกิจกรรม → ปุ่ม Manage Activity
            actionHtml = `
                <button class="btn-manage-activity" onclick="openManageActivity(${act.id})">
                    Manage Activity
                </button>`;
        } else if (isJoined) {
            // เข้าร่วมแล้ว → ปุ่ม Leave Activity
            actionHtml = `
                <button class="btn-leave-activity" onclick="confirmLeaveActivity(${act.id})">
                    Leave Activity
                </button>`;
        } else {
                actionHtml = `
                    <button class="btn-join-activity" onclick="joinActivity(${act.id})">
                        Join Now
                    </button>`;
            }
        modalBody.innerHTML = `
        <div class="type-more">
                <span class="pill-category-modal ${mapTagClass(act.activityType)}">
                    <img src="${getactivityTypeIcon(act.activityType)}" alt="" width="16">
                    ${act.activityType}
                </span>
            </div>
            <div class="activity-modal-detail">
                <div class="modal-header-section">
                    <h2 class="modal-activity-title ${mapTagClass(act.activityType)}">${act.activityName}</h2>
                </div>

                <div class="modal-content-wrapper">
                    <div class="modal-left-side">
                        <img src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/500x250"}" 
                             alt="Activity" class="modal-activity-image">
                        
                        <p class="organizer-label">ผู้จัดกิจกรรม :</p>
                        <div class="organizer-info">
                            <img class="btn-img" src="${BASE_URL + act.createdBy.profileImg}" alt="" 
                                 onclick="viewProfile(${act.createdBy.id || act.createdBy.userId})">
                            <div>
                                ${act.createdBy.nickname}
                                <div>
                                    ${act.createdBy.averageScore}
                                    <div class="rating" data-score="${act.createdBy.averageScore}"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-right-side">
                        <div class="modal-description">
                            <p>${act.activityDescription || "-"}</p>
                        </div>
                        
                        <div class="participants-wrapper">
                            <div class="participants-badge ${participantClass}">
                                <img src="/img/account.png" alt="participants" width="24" height="24">
                                <span class="participants-count">${act.currentParticipants}/${act.maxParticipants}</span>
                            </div>
                            ${isJoined ? '<span class="joined-indicator">✓ คุณเข้าร่วมกิจกรรมนี้แล้ว</span>' : ''}
                        </div>
                        
                        <div class="modal-info-grid">
                            <div class="modal-info-item">
                                <img src="/img/position.png" alt="location" width="20" height="20">
                                <span class="info-label-text">สถานที่ :</span>
                                <span class="info-value-text">${act.location}</span>
                            </div>
                            
                            <div class="modal-info-item">
                                <img src="/img/calendar.png" alt="date" width="20" height="20">
                                <span class="info-label-text">เริ่ม :</span>
                                <span class="info-value-text">${formatDate(act.activityDateStart)}</span>
                            </div>
                            
                            <div class="modal-info-item">
                                <img src="/img/time.png" alt="time" width="20" height="20">
                                <span class="info-label-text">เวลา :</span>
                                <span class="info-value-text">${act.activityTimeStart} - ${act.activityTimeEnd}</span>
                            </div>
                            
                            <div class="modal-info-item">
                                <img src="/img/time.png" alt="time" width="20" height="20">
                                <span class="info-label-text">ปิดรับประกาศ :</span>
                                <span class="info-value-text">${formatDate(act.announceDateEnd)} - ${act.announceTimeEnd}</span>
                            </div>
                        </div>
                        
                        <div class="modal-action-button">
                            ${actionHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = "flex";
        renderStars();
    } catch (err) {
        console.error(err);
        alert("ไม่สามารถโหลดรายละเอียดได้");
    }
}

function renderStars() {
  document.querySelectorAll(".rating").forEach(rating => {
    const score = parseFloat(rating.dataset.score) || 0;
    const fullStars = Math.floor(score);         // ดาวเต็ม
    const halfStar = score % 1 >= 0.5;           // ครึ่งดาว
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHtml = "";

    // ⭐ ดาวเต็ม
    for (let i = 0; i < fullStars; i++) {
      starsHtml += `<img src="img/star.png" alt="★">`;
    }
    // 🌗 ครึ่งดาว
    if (halfStar) {
      starsHtml += `<img src="img/star-half.png" alt="☆">`;
    }
    // ☆ ดาวว่าง
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += `<img src="img/star-gray.png" alt="☆">`;
    }

    rating.innerHTML = starsHtml;
  });
}


// ฟังก์ชันยืนยันก่อน Leave Activity
function confirmLeaveActivity(id) {
    if (alert("คุณแน่ใจหรือไม่ที่จะออกจากกิจกรรมนี้?")) {
        leaveActivity(id);
    }
}

// ====== LEAVE ACTIVITY ======
async function leaveActivity(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนออกจากกิจกรรม");
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/api/activity/leave`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ activityId: id })
        });
        const data = await res.json();
        if (res.ok) {
            alert("ออกจากกิจกรรมสำเร็จ");
            modal.style.display = "none"; // ปิด modal
            await loadActivities(); // รีโหลดข้อมูล
        } else {
            alert("ไม่สามารถออกจากกิจกรรม: " + (data.message || "unknown"));
        }
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
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
            categoryBtn.textContent = "▾ หมวดหมู่";
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
  sortDropdown.querySelectorAll(".dropdown-content button").forEach(btn => {
    btn.addEventListener("click", () => {
      sortDropdown.classList.remove("open");

      const label = btn.innerText.trim();
      sortBtn.textContent = "▾ " + label;

      // เก็บค่าจาก data-sort
      sortBy = btn.dataset.sort;  // "rating" | "participants" | "date"
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
const cancleact = document.getElementById("cancle-act");

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
cancleact?.addEventListener("click", () => {
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
