const BASE_URL = "http://localhost:5000";


// --------------------Navigation Menu Toggle ----------------------- //
document.addEventListener("DOMContentLoaded", async () => {
    const userSection = document.getElementById("userSection");
    const token = localStorage.getItem("token");

    // ✅ Check token → ดึงข้อมูลจาก /me
    // ถ้าไม่มี token → แสดงปุ่ม Login
    if (!token) {
        userSection.innerHTML = `<a href="#" class="btn-login" id="openLogin">Login</a>`;
    } else {
        try {
            const res = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Token invalid");
            const user = await res.json();

            const profileImgUrl = user.profileImg ? BASE_URL + user.profileImg : "./img/profile.png";

            userSection.innerHTML = `
  <div class="user-menu" id="userMenu">
    <div class="user-info" id="userToggle">
      <img src="${profileImgUrl}" alt="Profile">
      <span>${user.nickname}</span>
    </div>
    <div class="user-dropdown" id="userDropdown">
      <a href="./myprofile.html">👤 My Profile</a>
      <a href="#" id="logoutBtn">🚪 Logout</a>
    </div>
  </div>
`;


            // toggle dropdown
            const userMenu = document.getElementById("userMenu");
            const userToggle = document.getElementById("userToggle");
            userToggle.addEventListener("click", () => {
                userMenu.classList.toggle("open");
            });

            // close dropdown when click outside
            window.addEventListener("click", (e) => {
                if (!userMenu.contains(e.target)) {
                    userMenu.classList.remove("open");
                }
            });

            // logout
            document.getElementById("logoutBtn").addEventListener("click", () => {
                localStorage.removeItem("token");
                location.href = "./index.html";
                location.reload();
            });
        } catch (err) {
            console.error("Auth error:", err);
            localStorage.removeItem("token");
            userSection.innerHTML = `<a href="#" class="btn-login" id="openLogin">Login</a>`;
        }
    }

    // Elements
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    const openRegister = document.getElementById("openRegister");
    const backToLogin = document.getElementById("backToLogin");

    // Delegate openLogin
    document.body.addEventListener("click", e => {
        if (e.target && e.target.id === "openLogin") {
            e.preventDefault();
            loginModal.style.display = "flex";
        }
    });

    openRegister?.addEventListener("click", e => {
        e.preventDefault();
        loginModal.style.display = "none";
        registerModal.style.display = "flex";
    });

    backToLogin?.addEventListener("click", e => {
        e.preventDefault();
        registerModal.style.display = "none";
        loginModal.style.display = "flex";
    });

    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", e => {
            const modalId = e.target.getAttribute("data-close");
            document.getElementById(modalId).style.display = "none";
        });
    });

    window.addEventListener("click", e => {
        if (e.target.classList.contains("modal")) {
            e.target.style.display = "none";
        }
    });

    // ✅ Handle Login
    document.getElementById("loginForm").addEventListener("submit", async e => {
        e.preventDefault();
        const formData = {
            username: e.target.username.value,
            password: e.target.password.value
        };

        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("token", data.token);
            alert("Login สำเร็จ!");
            loginModal.style.display = "none";
            location.reload();
        } else {
            const err = await res.json();
            alert("Login ไม่สำเร็จ: " + err.message);
        }
    });

    // ✅ Handle Register
    document.getElementById("registerForm").addEventListener("submit", async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("สมัครสมาชิกสำเร็จ! กรุณา Login");
            registerModal.style.display = "none";
            loginModal.style.display = "flex";
        } else {
            const err = await res.json();
            alert("Register ล้มเหลว: " + err.message);
        }
    });
});

const userMenu = document.getElementById("userMenu");
const userToggle = document.getElementById("userToggle");

userToggle.addEventListener("click", () => {
    userMenu.classList.toggle("open");
});

// ปิด dropdown เมื่อคลิกนอก
window.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
        userMenu.classList.remove("open");
    }
});



// -------------------- Notification ----------------------- //
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const notifyBtn = document.getElementById("notifyBtn");
    const notifyCount = document.getElementById("notifyCount");
    const notifyDropdown = document.getElementById("notifyDropdown");

    // โหลด notification ของ user
    async function loadNotifications() {
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/api/notification/my`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("โหลด notifications ไม่ได้");
            const notifications = await res.json();

            // ✅ นับเฉพาะที่ยังไม่ได้อ่าน
            const unreadCount = notifications.filter(n => !n.isRead).length;
            notifyCount.textContent = unreadCount;

            // ✅ สร้าง dropdown list
            notifyDropdown.innerHTML = notifications.map(n => `
        <div class="item ${n.type}" data-id="${n.id}">
          <strong>${n.title}</strong><br>
          <small>${n.message}</small><br>
          <small style="color:gray;">${new Date(n.createdAt).toLocaleString()}</small>
          ${n.isRead ? "" : `<button class="mark-read" data-id="${n.id}">✓</button>`}
        </div>
      `).join("");

            // ✅ ติด event ให้ปุ่ม mark-read
            document.querySelectorAll(".mark-read").forEach(btn => {
                btn.addEventListener("click", async e => {
                    const id = e.target.getAttribute("data-id");
                    await markAsRead(id);
                    console.log("Marked as read:", id);
                    await loadNotifications();
                });
            });

        } catch (err) {
            console.error("Error loading notifications:", err);
        }
    }

    // ✅ API mark as read
    async function markAsRead(id) {
        const res = await fetch(`${BASE_URL}/api/notification/read/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) console.error("Mark as read failed");
    }

    // toggle dropdown
    notifyBtn?.addEventListener("click", () => {
        notifyDropdown.style.display =
            notifyDropdown.style.display === "block" ? "none" : "block";
    });

    // ปิด dropdown เมื่อคลิกนอก
    window.addEventListener("click", e => {
        if (!notifyBtn.contains(e.target)) {
            notifyDropdown.style.display = "none";
        }
    });

    // โหลด noti ครั้งแรก
    if (token) {
        await loadNotifications();
    }
});


