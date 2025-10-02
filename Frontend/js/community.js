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

// เปิด modal แสดงรายละเอียด
function openPostModal(post) {
  const modal = document.getElementById("viewPostModal");
  const content = document.getElementById("viewPostContent");

  content.innerHTML = `
    <h2>${post.title}</h2>
    <div class="view-post-meta">โพสต์โดย <b>${post.username}</b> • ${new Date(
      post.createdAt
    ).toLocaleString()}</div>
    <p>${post.message}</p>
    ${post.discription ? `<p><i>${post.discription}</i></p>` : ""}
    ${post.image ? `<img src="${BASE_URL + post.image}" alt="post-img">` : ""}
    <span class="post-type ${post.type}">${post.type}</span>
  `;

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
      Photo: "#9b5de5",
      Painting: "#f15bb5",
      Music: "#00bbf9",
      Writing: "#00f5d4"
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

    // ✅ ใช้ innerHTML เช่นกัน
    btn.innerHTML = this.innerHTML;
    btn.classList.add("selected");

    btn.style.background = window.getComputedStyle(this).backgroundColor;
    btn.style.color = window.getComputedStyle(this).color;

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
