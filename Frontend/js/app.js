const BASE_URL = "http://45.141.27.231:5000";


// --------------------Navigation Menu Toggle ----------------------- //
document.addEventListener("DOMContentLoaded", async () => {
    const userSection = document.getElementById("userSection");
    const token = localStorage.getItem("token");

    // ✅ Check token → ดึงข้อมูลจาก /me
    // ถ้าไม่มี token → แสดงปุ่ม Login
    if (!token) {
        userSection.innerHTML = `
  <a class="login-chip" href="#" id="openLogin">
    <span class="avatar is-icon" aria-hidden="true"><i class="fa-solid fa-user"></i></span>
    <span class="pill">Log in / Sign in</span>
  </a>
`;
    } else {
        try {
            const res = await fetch(`${BASE_URL}/api/auth/me`, {
                
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Token invalid");
            const user = await res.json();
            if (user && (user.username || user.name)) {
                localStorage.setItem("username", user.username || user.name);
            }
            const profileImgUrl = user.profileImg ? BASE_URL + user.profileImg : "./img/profile.png";

            userSection.innerHTML = `
  <div class="user-menu" id="userMenu">
    <a class="login-chip" href="#" id="userToggle">
      <span class="avatar" style="background-image:url('${profileImgUrl}')"></span>
      <span class="pill" id="navDisplayName">${user.nickname}</span>
    </a>
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
                localStorage.removeItem("username");
                location.href = "./index.html";
                location.reload();
            });
        } catch (err) {
            console.error("Auth error:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("username");
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
    document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close");
        document.getElementById(modalId).style.display = "none";
    });
});
function clearRegisterForm() {
    const fileInput = document.querySelector('#registerModal input[type="file"]');
    if (fileInput) fileInput.value = "";
    const fileName = document.querySelector('#registerModal .file-name');
    if (fileName) fileName.textContent = "ไม่ได้เลือกไฟล์ใด";
    // เคลียร์ input อื่นๆ ถ้าต้องการ
}

// เมื่อปิด register modal ด้วย Cancel
document.querySelectorAll('[data-close="registerModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("registerModal").style.display = "none";
        clearRegisterForm();
    });
});

// เมื่อเปิด login modal
document.getElementById("openLogin")?.addEventListener("click", () => {
    document.getElementById("loginModal").style.display = "flex";
    clearRegisterForm();
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
// -------------------- Notification ----------------------- //
const notifyBtn = document.getElementById("notifyBtn");
const notifyDropdown = document.getElementById("notifyDropdown");
const notifyCount = document.getElementById("notifyCount");
let notiWorker = null;

/* ============================
   Render Notification UI
============================ */
function renderNotifications(notis) {
    const unreadCount = notis.filter(n => !n.isRead).length;
    notifyCount.textContent = unreadCount;

    if (notifyDropdown.classList.contains("active")) {
        if (notis.length === 0) {
            notifyDropdown.innerHTML = `<div class="empty">ไม่มีการแจ้งเตือน</div>`;
            return;
        }

        notifyDropdown.innerHTML = notis.map(n => {
            let iconClass = "fa-info-circle"; // default
            if (n.type === "success") iconClass = "fa-check-circle";
            else if (n.type === "error") iconClass = "fa-times-circle";
            else if (n.type === "warning") iconClass = "fa-exclamation-triangle";
            else if (n.type === "start") iconClass = "fa-flag";

            return `
                <div class="noti-item ${n.isRead ? "" : "unread"} ${n.type}" data-id="${n.id}">
                    <div class="icon"><i class="fas ${iconClass}"></i></div>
                    <div class="text">
                        <h3>${n.title}</h3>
                        <p>${n.message}</p>
                        <small>${new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                </div>
            `;
        }).join("");

        notifyDropdown.querySelectorAll(".noti-item").forEach(item => {
            item.onclick = async () => {
                const id = item.dataset.id;
                if (id) await markAsRead(id);
            };
        });
    }
}

/* ============================
   Mark as Read API
============================ */
async function markAsRead(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch(`${BASE_URL}/api/notification/read/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
    } catch (err) {
        console.error("MarkAsRead error:", err);
    }
}

/* ============================
   Worker Start/Stop
============================ */
let lastNotis = [];

function isSameNotifications(newNotis, oldNotis) {
    if (newNotis.length !== oldNotis.length) return false;

    for (let i = 0; i < newNotis.length; i++) {
        const n1 = newNotis[i];
        const n2 = oldNotis[i];

        if (!n2) return false;

        if (
            n1.id !== n2.id ||
            n1.isRead !== n2.isRead ||
            n1.title !== n2.title ||
            n1.message !== n2.message ||
            new Date(n1.createdAt).getTime() !== new Date(n2.createdAt).getTime()
        ) {
            return false;
        }
    }
    return true;
}


function startNotificationWorker() {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (notiWorker) stopNotificationWorker(); // กันซ้ำ
    notiWorker = new Worker("./js/notiWorker.js");

    // notiWorker = new Worker("./notiWorker.js");
    notiWorker.postMessage({
        action: "start",
        url: `${BASE_URL}/api/notification/my`,
        token: token
    });

    notiWorker.onmessage = (e) => {
        if (e.data.success) {
            const newNotis = e.data.notis;

            // 🔎 Compare ทุก field สำคัญ
            if (!isSameNotifications(newNotis, lastNotis)) {
                renderNotifications(newNotis);
                // copy object กัน mutation
                lastNotis = JSON.parse(JSON.stringify(newNotis));
            }
        } else {
            console.error("Worker error:", e.data.error);
        }
    };


}

function stopNotificationWorker() {
    if (notiWorker) {
        notiWorker.postMessage({ action: "stop" });
        notiWorker.terminate();
        notiWorker = null;
    }
}

/* ============================
   UI Events
============================ */
notifyBtn.addEventListener("click", () => {
    notifyDropdown.classList.toggle("active");

    if (notifyDropdown.classList.contains("active")) {
        // ✅ render notis ล่าสุดทันที
        renderNotifications(lastNotis);
    }
});


document.addEventListener("click", (e) => {
    if (!notifyBtn.contains(e.target)) {
        notifyDropdown.classList.remove("active");
    }
});

// --------------------Hamburger Toggle----------------------- //
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
});


/* ============================
   Init
============================ */
if (localStorage.getItem("token")) {
    startNotificationWorker();
}
