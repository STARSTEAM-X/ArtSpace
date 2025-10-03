// -----------------------------
// Icon map สำหรับแต่ละประเภท
// -----------------------------
const typeIcons = {
  Photo: "fa-solid fa-camera",
  Painting: "fa-solid fa-paintbrush",
  Music: "fa-solid fa-music",
  Writing: "fa-solid fa-pen-nib"
};

// โหลดโพสต์ + รองรับ search/filter
async function loadPosts() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const filter = document.getElementById("filterType").value;

  try {
    const res = await fetch(`${BASE_URL}/api/community`);
    const posts = await res.json();

    // filter
    const filtered = posts.filter((p) => {
      const matchSearch =
        !search ||
        (p.title && p.title.toLowerCase().includes(search)) ||
        (p.message && p.message.toLowerCase().includes(search)) ||
        (p.discription && p.discription.toLowerCase().includes(search)) ||
        (p.username && p.username.toLowerCase().includes(search));

      const matchFilter = !filter || p.type === filter;
      return matchSearch && matchFilter;
    });

    // render เฉพาะหัวข้อ + icon
    const postList = document.getElementById("postList");
    if (filtered.length === 0) {
      postList.innerHTML = "<p style='text-align:center;color:#888;'>❌ ไม่พบโพสต์</p>";
      return;
    }

    postList.innerHTML = filtered.map((p) => `
      <div class="post-card simple" data-id="${p.id}">
        <i class="${typeIcons[p.type] || "fa-regular fa-file"} post-icon"></i>
        <span class="post-title">${p.title || "-"}</span>
      </div>
    `).join("");

    // ✅ event เปิด modal
    document.querySelectorAll(".post-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const post = filtered.find((p) => String(p.id) === String(id));
        if (post) openPostModal(post);
      });
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// เปิด modal แสดงรายละเอียด
function openPostModal(post) {
  const modal = document.getElementById("viewPostModal");
  const content = document.getElementById("viewPostContent");

  // รองรับ avatar ทั้ง post.avatar และ post.user.profileImg (หรือ ProfileImg)
  const rawAvatar = post.avatar || post.profileImg || (post.user && (post.user.profileImg || post.user.ProfileImg));
  const avatarSrc = rawAvatar
    ? (String(rawAvatar).startsWith("http") ? rawAvatar : (BASE_URL + rawAvatar))
    : "https://i.pravatar.cc/80";

  // ป้ายประเภท
  const typeLabelMap = { Photo: "Photography", Painting: "Visual Arts", Music: "Music", Writing: "Writing" };
  const typeLabel = typeLabelMap[post.type] || post.type || "Community";

  // รูปผลงาน (รองรับ URL เต็มหรือ path สัมพัทธ์)
  const imgHTML = post.image
    ? `<div class="hero"><img src="${String(post.image).startsWith('http') ? post.image : (BASE_URL + post.image)}" alt="${post.title || ''}"></div>`
    : "";

  // ดาวเรต (ถ้ามี)
  const rating = Number(post.rating || 0);
  const stars = rating ? `<span class="rating">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>` : "";

  content.innerHTML = `
    <div class="detail-type">
      <div class="type-badge ${post.type || ""}">
        <i class="${(typeIcons[post.type] || "fa-regular fa-file")}"></i> ${typeLabel}
      </div>
    </div>

    <div class="detail-card">
      <div class="detail-header">
        <div class="title">${post.title || "-"}</div>
      </div>

      <div class="detail-body">
        ${imgHTML}
        <div class="text">
          ${post.message ? `<p>${post.message}</p>` : ""}
          ${post.discription ? `<p>${post.discription}</p>` : ""}
        </div>

        <div class="detail-footer">
          <div class="author">
            <img class="avatar" src="${avatarSrc}" alt="${post.username || ""}">
            <div>
              <div class="name">ผู้เขียน : ${post.username || "-"}</div>
              ${stars}
            </div>
          </div>

          ${
            (localStorage.getItem("username") && localStorage.getItem("username") === post.username)
              ? `<div class="owner-actions">
                   <button class="edit-btn" id="editPostBtn">Edit</button>
                   <button class="delete-btn" id="deletePostBtn">Delete</button>
                 </div>`
              : ``
          }
        </div>
        <div class="view-post-meta">เผยแพร่เมื่อ ${post.createdAt ? new Date(post.createdAt).toLocaleString() : "-"}</div>
      </div>
    </div>
  `;

  // --- Edit (เปิด Modal + พรีฟิล) ---
  const editBtn = document.getElementById("editPostBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const m = document.getElementById("editPostModal");
      const f = document.getElementById("editPostForm");
      if (!m || !f) return;

      f.id.value = post.id;
      f.title.value = post.title || "";
      f.message.value = post.message || "";
      f.discription.value = post.discription || "";
      if (f.type) f.type.value = post.type || "Photo";

      m.style.display = "flex";
    });
  }

  // --- Delete (/api/community/{id}) ---
  const deleteBtn = document.getElementById("deletePostBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("ต้องการลบโพสต์นี้หรือไม่?")) return;

      const token = localStorage.getItem("token");
      if (!token) { alert("กรุณาเข้าสู่ระบบ"); return; }

      try {
        const res = await fetch(`${BASE_URL}/api/community/${post.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          alert("ลบโพสต์สำเร็จ");
          document.getElementById("viewPostModal").style.display = "none";
          loadPosts();
        } else {
          alert("ลบไม่สำเร็จ: " + (data.message || res.status));
        }
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดระหว่างลบ");
      }
    });
  }

  modal.style.display = "flex";
}

// ===== Edit Modal Controls & Submit =====
document.getElementById("closeEditPostModal")?.addEventListener("click", () => {
  document.getElementById("editPostModal").style.display = "none";
});
document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
  document.getElementById("editPostModal").style.display = "none";
});

// PUT /api/community/{id}
document.getElementById("editPostForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) { alert("กรุณาเข้าสู่ระบบ"); return; }

  const formEl = e.target;
  const id = formEl.id.value;

  const formData = new FormData();
  formData.append("title", formEl.title.value);
  formData.append("message", formEl.message.value);
  formData.append("discription", formEl.discription.value);
  formData.append("type", formEl.type.value);
  if (formEl.image.files[0]) {
    formData.append("image", formEl.image.files[0]);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/community/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      alert("บันทึกการแก้ไขแล้ว");
      document.getElementById("editPostModal").style.display = "none";
      document.getElementById("viewPostModal").style.display = "none";
      loadPosts();
    } else {
      alert("แก้ไขไม่สำเร็จ: " + (data.message || res.status));
    }
  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดระหว่างแก้ไข");
  }
});

// ปิด modal อ่านโพสต์
document.getElementById("closeViewPost").addEventListener("click", () => {
  document.getElementById("viewPostModal").style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target.id === "viewPostModal") {
    document.getElementById("viewPostModal").style.display = "none";
  }
});

// ---------------- Events ---------------- //

// search input / filter
document.getElementById("searchInput").addEventListener("input", loadPosts);
document.getElementById("filterType").addEventListener("change", loadPosts);

// clear
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterType").value = "";
  loadPosts();
});

// new post modal (อนุญาตเฉพาะผู้ล็อกอิน)
document.getElementById("newPostBtn").addEventListener("click", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนสร้างโพสต์");
    return;
  }
  document.getElementById("postModal").style.display = "flex";
});
document.getElementById("closePostModal").addEventListener("click", () => {
  document.getElementById("postModal").style.display = "none";
});

// ส่งโพสต์ใหม่
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนโพสต์");
    return;
  }

  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${BASE_URL}/api/community/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ โพสต์สำเร็จ!");
      document.getElementById("postModal").style.display = "none";
      e.target.reset();
      loadPosts();
      localStorage.setItem("refreshProfile", "1");
    } else {
      alert("❌ " + (data.message || "เกิดข้อผิดพลาด"));
    }
  } catch (err) {
    console.error("Error creating post:", err);
    alert("เกิดข้อผิดพลาด");
  }
});

// โหลดครั้งแรก
document.addEventListener("DOMContentLoaded", loadPosts);

// -----------------------------
// Category Filter (หน้า Community)
// -----------------------------
document.querySelectorAll('.search-bar .category-item').forEach(item => {
  item.addEventListener('click', function () {
    const value = this.dataset.value;
    const hiddenInput = document.getElementById('filterType');
    const dropdown = this.closest('.category-dropdown');
    const btn = dropdown.querySelector('.category-btn');

    hiddenInput.value = value;
    btn.innerHTML = this.innerHTML;
    btn.classList.add("selected");

    const typeColors = {
      "": "#6c757d",
      Photo: "#9d26ed",
      Painting: "#5174ff",
      Music: "#f158be",
      Writing: "#dd23dd"
    };
    btn.style.setProperty("--selected-bg", typeColors[value] || "#7209b7");
    btn.classList.add("selected");
    btn.style.color = "#fff";

    dropdown.classList.remove('show');
    loadPosts();
  });
});

// -----------------------------
// Category ใน Post Modal
// -----------------------------
document.querySelectorAll('#postForm .category-item').forEach(item => {
  item.addEventListener('click', function () {
    const value = this.dataset.value;
    const hiddenInput = document.getElementById('postCategory');
    const dropdown = this.closest('.category-dropdown');
    const btn = dropdown.querySelector('.category-btn');

    hiddenInput.value = value;
    btn.innerHTML = this.innerHTML;
    btn.classList.add('selected');

    const typeColors = {
      "": "#6c757d",
      Photo: "#9d26ed",
      Painting: "#5174ff",
      Music: "#f158be",
      Writing: "#dd23dd"
    };
    btn.style.setProperty('--selected-bg', typeColors[value] || '#7209b7');
    btn.style.color = '#fff';

    dropdown.classList.remove('show');
  });
});

// toggle เปิด/ปิด dropdown
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const dropdown = this.closest('.category-dropdown');
    dropdown.classList.toggle('show');
  });
});

// คลิกนอก dropdown ให้ปิด
document.addEventListener('click', () => {
  document.querySelectorAll('.category-dropdown').forEach(d => d.classList.remove('show'));
});
