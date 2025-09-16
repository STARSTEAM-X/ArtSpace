const API_BASE = "http://localhost:5000/api";
let token = localStorage.getItem("token") || "";

// ✅ Login
async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        alert("Login สำเร็จ");
        window.location = "activities.html";
    } else {
        alert("Login ไม่สำเร็จ");
    }
}

// ✅ Register
async function register() {
    const formData = new FormData();
    formData.append("Username", document.getElementById("regUsername").value);
    formData.append("Email", document.getElementById("regEmail").value);
    formData.append("Password", document.getElementById("regPassword").value);

    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        body: formData
    });
    const data = await res.json();
    alert(data.message || "Registered");
}

// ✅ Load Activities
async function loadActivities() {
    const res = await fetch(`${API_BASE}/activity/list`);
    const activities = await res.json();
    console.log(activities);
    const container = document.getElementById("activities");
    container.innerHTML = "";

    activities.forEach(a => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
      <h3>${a.activityName}</h3>
      <p>${a.activityDescription}</p>
      <p>📍 ${a.location || "ไม่ระบุ"}</p>
      <p>👥 ${a.cerrentParticipants}/${a.maxParticipants}</p>
      ${a.imageUrl ? `<img src="http://localhost:5000${a.imageUrl}">` : ""}
      <button onclick="joinActivity(${a.id})">Join</button>
      <button onclick="leaveActivity(${a.id})">Leave</button>
    `;
        container.appendChild(div);
    });
}

// ✅ Create Activity
async function createActivity() {
    if (!token) return alert("กรุณา Login ก่อน");
    const formData = new FormData();
    formData.append("ActivityName", document.getElementById("actName").value);
    formData.append("ActivityDescription", document.getElementById("actDesc").value);
    formData.append("ActivityDateStart", document.getElementById("actStart").value);
    formData.append("ActivityDateEnd", document.getElementById("actEnd").value);
    formData.append("MaxParticipants", document.getElementById("actMax").value);
    formData.append("activityImage", document.getElementById("actImg").files[0]);

    const res = await fetch(`${API_BASE}/activity/createactivity`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    const data = await res.json();
    alert(data.message || "Activity created");
    window.location = "activities.html";
}

// ✅ Join
async function joinActivity(id) {
    if (!token) return alert("กรุณา Login ก่อน");
    const res = await fetch(`${API_BASE}/activity/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activityId: id })
    });
    const data = await res.json();
    alert(data.message || "Joined");
    loadActivities();
}

// ✅ Leave
async function leaveActivity(id) {
    if (!token) return alert("กรุณา Login ก่อน");
    const res = await fetch(`${API_BASE}/activity/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activityId: id })
    });
    const data = await res.json();
    alert(data.message || "Left");
    loadActivities();
}
