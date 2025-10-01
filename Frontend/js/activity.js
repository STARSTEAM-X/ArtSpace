// ====== STATE & ELEMENTS ======
const container = document.getElementById("activitiesContainer");
const modal = document.getElementById("activityModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

const searchInput = document.getElementById("searchInput");
const btnSearch = document.querySelector(".btn-search");
const categoryBtn = document.getElementById("categoryBtn");
const sortBtn = document.getElementById("sortBtn");

// create modal
const createModal = document.getElementById("createModal");
const createClose = document.getElementById("createClose");
const createForm = document.getElementById("createActivityForm");

let allActivities = [];
let selectedCategory = "";
let sortBy = "";

// ====== IMAGE HELPER ======
function getImageUrl(act, size = "300x150") {
  const raw = act.activityImage || act.imageUrl || act.ImageUrl || "";
  if (!raw) {
    return `https://via.placeholder.com/${size}`;
  }
  if (raw.startsWith("http")) {
    return raw;
  }
  return BASE_URL + raw;
}

// ====== LOAD & RENDER ======
async function loadActivities() {
  try {
    const res = await fetch(`${BASE_URL}/api/activity/list`);
    if (!res.ok) throw new Error("โหลดกิจกรรมล้มเหลว");
    allActivities = await res.json();
    applyFilters();
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
    .slice()
    .reverse()
    .map(act => `
      <div class="card">
        <span class="tag ${mapTagClass(act.activityType)}">${act.activityType || "-"}</span>
        <h3>${act.activityName || act.ActivityName}</h3>
        <img src="${getImageUrl(act)}" alt="activity">
        <p><i class="fa fa-map-marker"></i> ${act.location || act.Location || "-"}</p>
        <p><i class="fa fa-calendar"></i> ${formatDate(act.activityDateStart || act.ActivityDateStart)} - ${formatDate(act.activityDateEnd || act.ActivityDateEnd)}</p>
        <p><i class="fa fa-clock"></i> ${act.activityTimeStart || act.ActivityTimeStart} - ${act.activityTimeEnd || act.ActivityTimeEnd}</p>
        <div class="status ${(act.currentParticipants || 0) < (act.maxParticipants || 0) ? "success" : "danger"}">
          ${act.currentParticipants || 0}/${act.maxParticipants || 0}
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
  const kw = (searchInput?.value || "").trim().toLowerCase();

  if (kw) {
    list = list.filter(a =>
      (a.activityName || a.ActivityName || "").toLowerCase().includes(kw) ||
      (a.createdByUserName || "").toLowerCase().includes(kw)
    );
  }

  if (selectedCategory) {
    list = list.filter(a => (a.activityType || "").toLowerCase() === selectedCategory.toLowerCase());
  }

  if (sortBy === "participants") {
    list.sort((a, b) => ((b.currentParticipants || 0) - (a.currentParticipants || 0)));
  } else if (sortBy === "date") {
    list.sort((a, b) => new Date(a.activityDateStart || a.ActivityDateStart) - new Date(b.activityDateStart || b.ActivityDateStart));
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
      <h2>${act.activityName || act.ActivityName}</h2>
      <img src="${getImageUrl(act, "500x250")}" alt="activity">
      <p><strong>รายละเอียด:</strong> ${act.activityDescription || act.ActivityDescription || "-"}</p>
      <p><i class="fa fa-map-marker"></i> ${act.location || act.Location || "-"}</p>
      <p><i class="fa fa-calendar"></i> ${formatDate(act.activityDateStart || act.ActivityDateStart)} - ${formatDate(act.activityDateEnd || act.ActivityDateEnd)}</p>
      <p><i class="fa fa-clock"></i> ${act.activityTimeStart || act.ActivityTimeStart} - ${act.activityTimeEnd || act.ActivityTimeEnd}</p>
      <p><strong>ผู้เข้าร่วม:</strong> ${(act.currentParticipants || 0)}/${act.maxParticipants || 0}</p>
      <p><strong>ผู้สร้าง:</strong> ${act.createdByUserName || "-"}</p>
      <div style="margin-top:15px; text-align:right;">
        <button class="join" onclick="joinActivity(${act.id})">Join Now</button>
      </div>
    `;
    if (modal) modal.style.display = "flex";
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
      await loadActivities();
    } else {
      alert("ไม่สามารถเข้าร่วม: " + (data.message || "unknown"));
    }
  } catch (err) {
    console.error(err);
  }
}

// ====== CREATE ACTIVITY ======
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
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert("สร้างกิจกรรมสำเร็จ!");
      createForm.reset();
      createModal.style.display = "none";
      await loadActivities(); // refresh list
    } else {
      alert("สร้างกิจกรรมไม่สำเร็จ: " + (data.message || "unknown error"));
    }
  } catch (err) {
    console.error("Error creating activity:", err);
    alert("เกิดข้อผิดพลาด ไม่สามารถสร้างกิจกรรมได้");
  }
});

// ====== HERO BUTTONS ======
const btnFind = document.getElementById("btnFind");
const btnCreate = document.getElementById("btnCreate");
const searchBar = document.querySelector(".search-bar");

btnFind?.addEventListener("click", () => {
  searchBar.scrollIntoView({ behavior: "smooth", block: "start" });
});

btnCreate?.addEventListener("click", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม");
    return; // ❌ หยุดที่นี่ ไม่ให้เปิด modal
  }
  if (createModal) createModal.style.display = "flex";
});

createClose?.addEventListener("click", () => {
  if (createModal) createModal.style.display = "none";
});

window.addEventListener("click", e => {
  if (e.target === createModal) {
    createModal.style.display = "none";
  }
});

// ====== DROPDOWN HANDLERS ======
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

document.querySelectorAll(".dropdown .dropdown-content .tag").forEach(item => {
  item.addEventListener("click", () => {
    const parent = item.closest(".dropdown");
    parent.classList.remove("open");

    const cat = item.innerText.trim();
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

(() => {
  const sortDropdown = sortBtn?.parentElement;
  sortDropdown?.querySelectorAll(".dropdown-content button:not(.tag)").forEach(item => {
    item.addEventListener("click", () => {
      sortDropdown.classList.remove("open");
      const label = item.innerText.trim();
      sortBtn.textContent = label;
      sortBy = label.includes("ผู้เข้าร่วม") ? "participants" : "date";
      applyFilters();
    });
  });
})();

window.addEventListener("click", () => {
  document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
});

// ====== SEARCH EVENTS ======
btnSearch?.addEventListener("click", applyFilters);
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") applyFilters(); });

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
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", loadActivities);
modalClose?.addEventListener("click", () => { if (modal) modal.style.display = "none"; });
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
