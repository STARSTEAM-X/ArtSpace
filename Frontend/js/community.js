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

    // console.log(posts)

    // filter
    let filtered = posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search) ||
        (p.message && p.message.toLowerCase().includes(search)) ||
        (p.discription && p.discription.toLowerCase().includes(search)) ||
        p.username.toLowerCase().includes(search);

      const matchFilter = !filter || p.type === filter;
      return matchSearch && matchFilter;
    });

    // render เฉพาะหัวข้อ + icon
    const postList = document.getElementById("postList");
    if (filtered.length === 0) {
      postList.innerHTML = "<p style='text-align:center;color:#888;'>❌ ไม่พบโพสต์</p>";
      return;
    }

    postList.innerHTML = filtered
      .map(
        (p) => `
        <div class="post-card simple" data-id="${p.id}">
          <i class="${typeIcons[p.type] || "fa-regular fa-file"} post-icon"></i>
          <span class="post-title">${p.title}</span>
        </div>
      `
      )
      .join("");

    // ✅ event เปิด modal
    document.querySelectorAll(".post-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const post = filtered.find((p) => p.id == id);
        if (post) openPostModal(post);
      });
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// เปิด modal แสดงรายละเอียด (ดีไซน์การ์ดแบบภาพตัวอย่าง)
function openPostModal(post) {
  const modal = document.getElementById("viewPostModal");
  const content = document.getElementById("viewPostContent");

  console.log(post)
  console.log(post.user.nickname)

  // แผนที่ "type" ไปเป็นป้ายบนขวา
  const typeLabelMap = {
    Photo: "Photography",
    Painting: "Visual Arts",
    Music: "Music",
    Writing: "Writing"
  };
  const typeLabel = typeLabelMap[post.type] || post.type || "Community";

  // ที่มารูป: ใช้รูปจาก backend ถ้ามี ไม่งั้นไม่แสดง
  const imgHTML = post.image
    ? `<div class="hero"><img src="${BASE_URL + post.image}" alt="${post.title}"></div>`
    : "";

  // ดาวเรต: ถ้ามี post.rating (1–5) ให้โชว์ดาว ไม่งั้นซ่อนไว้
  const rating = Number(post.rating || 0);
  const stars = rating
    ? `<span class="rating">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`
    : "";

  content.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div class="type-badge ${post.type || ""}">
          <i class="${(typeIcons[post.type] || "fa-regular fa-file")}"></i> ${typeLabel}
        </div>
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
            <img class="avatar" src="${post.user.profileImg ? (BASE_URL + post.user.profileImg) : '../img/profile.jpg'}" alt="${post.username}">
            <div>
              <div class="name">ผู้เขียน : ${post.user.nickname}</div>
              ${stars}
            </div>
          </div>

          ${
    // แสดงปุ่มแก้ไขเฉพาะกรณีเจ้าของโพสต์ (ถ้ามี token/username เท่ากัน)
    (localStorage.getItem("username") && localStorage.getItem("username") === post.username)
      ? `<button class="edit-btn" id="editPostBtn">Edit</button>`
      : ``
    }
        </div>
        <div class="view-post-meta">เผยแพร่เมื่อ ${new Date(post.createdAt).toLocaleString()}</div>
      </div>
    </div>
  `;

  // event ปุ่มแก้ไข (ถ้ามี)
  const editBtn = document.getElementById("editPostBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      // ไปหน้า edit ที่คุณมีอยู่ หรือจะเปิด modal แก้ไขก็ได้
      // ตัวอย่าง: location.href = `/community-edit.html?id=${post.id}`;
      alert("ตัวอย่าง: ไปหน้าแก้ไขโพสต์ id=" + post.id);
    });
  }

  modal.style.display = "flex";
}

// ปิด modal
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

// new post modal
document.getElementById("newPostBtn").addEventListener("click", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนสร้างโพสต์");
    return; // ❌ หยุด ไม่เปิด modal
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
      loadPosts(); // รีโหลดโพสต์ใหม่

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

    // ✅ ใช้ innerHTML เพื่อคง icon + text
    btn.innerHTML = this.innerHTML;
    btn.classList.add("selected");

    // ✅ ใช้สีจาก map
    const typeColors = {
      "": "#6c757d",        // เทา สำหรับ "All Categories"
      Photo: "#9d26ed ",
      Painting: "#5174ff",
      Music: "#f158be",
      Writing: "#dd23dd"
    };
    // เก็บค่าสีที่เลือกไว้ใน CSS variable
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

    // คงไอคอน + ชื่อไว้เหมือนเดิม
    btn.innerHTML = this.innerHTML;
    btn.classList.add('selected');

    // ใช้สีเดียวกับ filter ด้านบน
    const typeColors = {
      "": "#6c757d",        // เทา สำหรับ "All Categories"
      Photo: "#9d26ed ",
      Painting: "#5174ff",
      Music: "#f158be",
      Writing: "#dd23dd"
    };
    btn.style.setProperty('--selected-bg', typeColors[value] || '#7209b7');
    btn.style.color = '#fff';

    dropdown.classList.remove('show');
  });
});
// -----------------------------
// toggle เปิด/ปิด dropdown
// -----------------------------
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const dropdown = this.closest('.category-dropdown');
    dropdown.classList.toggle('show');
  });
});

// -----------------------------
// คลิกนอก dropdown ให้ปิด
// -----------------------------
document.addEventListener('click', () => {
  document.querySelectorAll('.category-dropdown').forEach(d => d.classList.remove('show'));
});
