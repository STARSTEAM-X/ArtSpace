// โหลดโพสต์ + รองรับ search/filter + กดอ่านเพิ่มเติม
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
                p.message.toLowerCase().includes(search) ||
                (p.discription && p.discription.toLowerCase().includes(search)) ||
                p.username.toLowerCase().includes(search);

            const matchFilter = !filter || p.type === filter;

            return matchSearch && matchFilter;
        });

        // render
        const postList = document.getElementById("postList");
        if (filtered.length === 0) {
            postList.innerHTML = "<p style='text-align:center;color:#888;'>❌ ไม่พบโพสต์</p>";
            return;
        }

        postList.innerHTML = filtered
            .map(
                (p) => `
      <div class="post-card" data-id="${p.id}">
        <div class="post-header">
          <div class="user-info">
            <img src="${BASE_URL + (p.userProfileImg || '/upload/default.png')}" class="avatar" alt="avatar">
            <div>
              <span class="username">${p.username}</span>
              <span class="time">${new Date(p.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <span class="post-type ${p.type}">${p.type}</span>
        </div>

        <h3 class="post-title">${p.title}</h3>
        <p class="post-message">${p.message.length > 100 ? p.message.substring(0, 100) + "..." : p.message}</p>
        ${p.image ? `<img src="${BASE_URL + p.image}" class="post-image">` : ""}
        <small class="read-more">📖 คลิกเพื่ออ่านเพิ่มเติม</small>
      </div>
    `
            )
            .join("");

        // ✅ attach event click
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
