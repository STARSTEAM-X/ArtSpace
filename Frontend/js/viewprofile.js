// ====== กันเรียกซ้ำ ======
let __isLoadingProfile = false;

// สร้าง status UI ไว้แสดงข้อความโหลด/เออเรอร์ (ถ้ายังไม่มี)
function ensureStatusEl() {
  let el = document.getElementById("statusMessage");
  if (!el) {
    el = document.createElement("div");
    el.id = "statusMessage";
    el.style.cssText = "margin:12px 0;font-size:14px;";
    document.body.prepend(el);
  }
  return el;
}
function setStatus(msg, type = "info") {
  const el = ensureStatusEl();
  el.textContent = msg || "";
  el.style.color = (type === "error") ? "#b00020" : "#444";
}

// ไอคอนประเภทงาน (ใช้ในรายการโพสต์ของผู้ใช้)
function getActivityIcon(type = "") {
  const map = {
    Photo: "📷",
    Painting: "🎨",
    Music: "🎵",
    Writing: "✒️",
  };
  return map[type] || "📄";
}

// ------------------ โหลดข้อมูลโปรไฟล์คนอื่น ------------------ //
async function loadProfile() {
  if (__isLoadingProfile) return;           // กันเรียกซ้ำ
  __isLoadingProfile = true;

  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('user');

  if (!username) {
    setStatus("กรุณาระบุชื่อผู้ใช้ (?user=...)", "error");
    __isLoadingProfile = false;
    return;
  }

  // ดึง token ถ้ามี
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    setStatus("กำลังโหลดโปรไฟล์...");

    // ✅ ใช้เส้นทางที่ถูกต้อง + แนบโทเคน (ถ้ามี)
    const res = await fetch(`${BASE_URL}/api/profile/${encodeURIComponent(username)}`, { headers });

    if (res.status === 401) {
      // ผู้ใช้ยังไม่ได้ล็อกอินหรือโทเคนไม่ถูกต้อง
      setStatus("โปรดเข้าสู่ระบบก่อนเพื่อดูโปรไฟล์ผู้ใช้", "error");
      __isLoadingProfile = false;
      return;
    }
    if (res.status === 404) {
      setStatus("ไม่พบผู้ใช้นี้", "error");
      __isLoadingProfile = false;
      return;
    }
    if (!res.ok) {
      setStatus("Error loading profile: โหลดข้อมูลล้มเหลว", "error");
      __isLoadingProfile = false;
      return;
    }

    const data = await res.json();

    // ----------------- ข้อมูลผู้ใช้ -----------------
    const profileImgEl = document.getElementById("profileImg");
    if (profileImgEl) {
      const src = data.profileImg
        ? (String(data.profileImg).startsWith("http") ? data.profileImg : (BASE_URL + data.profileImg))
        : "./img/profile.png";
      profileImgEl.src = src;
    }

    const nicknameEl = document.getElementById("nickname");
    if (nicknameEl) nicknameEl.textContent = data.nickname || data.username;

    const bioEl = document.getElementById("bio");
    if (bioEl) bioEl.textContent = data.bio || '"ยังไม่มี Bio"';

    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = data.username || "-";

    const emailEl = document.getElementById("email");
    if (emailEl) emailEl.textContent = data.email || "-";

    const fullnameEl = document.getElementById("fullname");
    if (fullnameEl) fullnameEl.textContent = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "-";

    const dobEl = document.getElementById("dob");
    if (dobEl) {
      dobEl.textContent = data.dateOfBirth
        ? new Date(data.dateOfBirth).toLocaleDateString()
        : "-";
    }

    const avgScore = Number(data.averageScore || 0);
    const avgScoreEl = document.getElementById("avgScore");
    if (avgScoreEl) avgScoreEl.textContent = avgScore.toFixed(1);

    const starsEl = document.getElementById("stars");
    if (starsEl) starsEl.textContent = "⭐".repeat(Math.round(avgScore));

    const joinedCountEl = document.getElementById("joinedCount");
    if (joinedCountEl) joinedCountEl.textContent = (data.joinedActivities?.length || 0);

    const createdCountEl = document.getElementById("createdCount");
    if (createdCountEl) createdCountEl.textContent = (data.createdActivities?.length || 0);

    // ----------------- Gallery -----------------
    const galleryList = document.getElementById("galleryList");
    if (galleryList) {
      if (!data.galleryList || data.galleryList.length === 0) {
        galleryList.innerHTML = "<p>ยังไม่มีรูปในแกลเลอรี่ ❌</p>";
      } else {
        galleryList.innerHTML = data.galleryList.map(img =>
          `<img src="${String(img).startsWith('http') ? img : (BASE_URL + img)}" alt="gallery">`
        ).join("");
      }
    }

    // ----------------- Joined Activities -----------------
    const joinedList = document.getElementById("joinedList");
    if (joinedList) {
      joinedList.innerHTML = (data.joinedActivities?.length || 0) === 0
        ? "<p>ยังไม่มีกิจกรรมเข้าร่วม ❌</p>"
        : data.joinedActivities.map(a => {
            const activityDate = new Date(a.activityDateStart);
            const today = new Date();
            const isPast = activityDate < today;
            const statusBadge = isPast
              ? '<span class="badge done">Done</span>'
              : '<span class="badge upcoming">Upcoming</span>';

            const imgSrc = a.imageUrl ? (String(a.imageUrl).startsWith('http') ? a.imageUrl : (BASE_URL + a.imageUrl)) : './img/noimage.png';

            return `
              <div class="activity-card">
                <span class="category-badge">${a.activityType || '-'}</span>
                ${statusBadge}
                <h4>${a.activityName || '-'}</h4>
                <img src="${imgSrc}" alt="${a.activityName || '-'}">
                <p>${activityDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            `;
          }).join("");
    }

    // ----------------- Created Activities -----------------
    const createdList = document.getElementById("createdList");
    if (createdList) {
      createdList.innerHTML = (data.createdActivities?.length || 0) === 0
        ? "<p>ยังไม่มีกิจกรรมที่สร้าง ❌</p>"
        : data.createdActivities.map(a => {
            const activityDate = new Date(a.activityDateStart);
            const today = new Date();
            const isPast = activityDate < today;
            const statusBadge = isPast
              ? '<span class="badge done">Done</span>'
              : '<span class="badge upcoming">Upcoming</span>';

            const imgSrc = a.imageUrl ? (String(a.imageUrl).startsWith('http') ? a.imageUrl : (BASE_URL + a.imageUrl)) : './img/noimage.png';

            return `
              <div class="activity-card">
                <span class="category-badge">${a.activityType || '-'}</span>
                ${statusBadge}
                <h4>${a.activityName || '-'}</h4>
                <img src="${imgSrc}" alt="${a.activityName || '-'}">
                <p>${activityDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            `;
          }).join("");
    }

    // ----------------- Posted (จาก Community API) -----------------
    const postedList = document.getElementById("postedList");
    if (postedList) {
      try {
        const res_post = await fetch(`${BASE_URL}/api/community/user/${encodeURIComponent(data.username)}`, { headers });
        if (res_post.ok) {
          const posts = await res_post.json();
          postedList.innerHTML = posts.length === 0
            ? "<p>ยังไม่มีโพสต์ ❌</p>"
            : posts.map(p => `
                <div class="post-item" data-id="${p.id}">
                  <span class="post-icon">${getActivityIcon(p.type || '')}</span>
                  <span>${p.title || '-'}</span>
                </div>
              `).join("");

          // คลิกโพสต์ไปหน้า community
          postedList.querySelectorAll(".post-item").forEach(item => {
            item.addEventListener("click", () => {
              const id = item.dataset.id;
              window.location.href = `./community.html?id=${id}`;
            });
          });
        } else {
          postedList.innerHTML = "<p>ยังไม่มีโพสต์ ❌</p>";
        }
      } catch {
        postedList.innerHTML = "<p>ยังไม่มีโพสต์ ❌</p>";
      }
    }

    // เคลียร์สถานะ (สำเร็จ)
    setStatus("");

  } catch (err) {
    console.error(err);
    setStatus("Error loading profile: โหลดข้อมูลล้มเหลว", "error");
  } finally {
    __isLoadingProfile = false;
  }
}

// ให้แน่ใจว่า “เรียกครั้งเดียว” ตอนเปิดหน้า
document.addEventListener("DOMContentLoaded", () => loadProfile(), { once: true });

// ----------------  Navigation Arrows ---------------- //
function setupScrollArrows(wrapperId, listId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const list = wrapper.querySelector(`#${listId}`);
  const leftArrow = wrapper.querySelector('.left-arrow');
  const rightArrow = wrapper.querySelector('.right-arrow');

  if (!list || !leftArrow || !rightArrow) return;

  leftArrow.addEventListener('click', () => {
    list.scrollBy({ left: -300, behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    list.scrollBy({ left: 300, behavior: 'smooth' });
  });
}

// เรียกใช้หลังจากโหลดข้อมูลเสร็จ
document.addEventListener("DOMContentLoaded", () => {
  setupScrollArrows('galleryWrapper', 'galleryList');
  setupScrollArrows('joinedWrapper', 'joinedList');
  setupScrollArrows('createdWrapper', 'createdList');
});
