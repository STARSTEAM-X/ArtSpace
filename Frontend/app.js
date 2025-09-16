const API_BASE = "http://localhost:5000";

// Register
const regForm = document.getElementById("registerForm");
if (regForm) {
    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(regForm);

        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        document.getElementById("registerMsg").textContent = data.message || "Registered!";
    });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            Username: loginForm.Username.value,
            Password: loginForm.Password.value,
        };
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            document.getElementById("loginMsg").textContent = "Login success!";
            window.location.href = "profile.html";
        } else {
            document.getElementById("loginMsg").textContent = data.message || "Login failed";
        }
    });
}

if (window.location.pathname.endsWith("profile.html")) {
    const token = localStorage.getItem("token");
    if (!token) {
        document.body.innerHTML = "<p>Please login first.</p>";
    } else {
        fetch(`${API_BASE}/api/auth/me`, {
            headers: { "Authorization": "Bearer " + token }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch profile");
                }
                return res.json();
            })
            .then(user => {
                document.getElementById("username").textContent = user.username;
                document.getElementById("email").textContent = user.email;
                document.getElementById("firstName").textContent = user.firstName || "-";
                document.getElementById("lastName").textContent = user.lastName || "-";
                document.getElementById("dob").textContent = user.dateOfBirth || "-";
                document.getElementById("createdAt").textContent = new Date(user.createdAt).toLocaleString();
                document.getElementById("isAdmin").textContent = user.isAdmin ? "Yes" : "No";
                document.getElementById("isActive").textContent = user.isActive ? "Active" : "Inactive";

                if (user.profileImg) {
                    document.getElementById("profileImg").src = API_BASE.replace("/api/auth", "") + user.profileImg;
                }
            })
            .catch(err => {
                document.body.innerHTML = `<p style="color:red;">${err.message}</p>`;
            });
    }
}

// Create Activity
const activityForm = document.getElementById("activityForm");
if (activityForm) {
    activityForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(activityForm);

        const token = localStorage.getItem("token");
        if (!token) {
            document.getElementById("activityMsg").textContent = "Please login first.";
            return;
        }

        try {
            // 🔹 ดึงข้อมูล user จาก /api/auth/me
            const userRes = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (!userRes.ok) {
                throw new Error("Failed to fetch user info");
            }
            const user = await userRes.json();

            // 🔹 ใส่ CreatedByUserName ลงใน formData
            formData.append("CreatedByUserName", user.username);

            // 🔹 ส่งไปที่ backend
            const res = await fetch(`${API_BASE}/api/activity/crateactivity`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }, // เผื่ออนาคตจะ protect route
                body: formData
            });

            const data = await res.json();
            document.getElementById("activityMsg").textContent =
                data.message || "Activity created successfully!";
        } catch (err) {
            document.getElementById("activityMsg").textContent = "Error creating activity.";
            console.error(err);
        }
    });
}


// Load Activities
if (window.location.pathname.endsWith("loadActivity.html")) {
    fetch(`${API_BASE}/api/activity/list`)
        .then(res => res.json())
        .then(activities => {
            const list = document.getElementById("activities");
            if (activities.length === 0) {
                list.innerHTML = "<p>No activities found.</p>";
                return;
            }
            activities.forEach(act => {
                const card = document.createElement("div");
                card.classList.add("card");
                card.style.marginBottom = "1rem";
                card.innerHTML = `
          <h3>${act.activityName}</h3>
          <p>${act.activityDescription || ""}</p>
          <p><strong>Date:</strong> ${act.activityDateStart} - ${act.activityDateEnd}</p>
          <p><strong>Time:</strong> ${act.activityTime || "-"}</p>
          <p><strong>Location:</strong> ${act.location || "-"}</p>
          <p><strong>Created By:</strong> ${act.createdByUserName}</p>
          ${act.imageUrl ? `<img src="http://localhost:5196${act.imageUrl}" style="max-width:200px;border-radius:8px;">` : ""}
        `;
                list.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Failed to load activities:", err);
            document.getElementById("activities").innerHTML = "<p style='color:red;'>Error loading activities.</p>";
        });
}