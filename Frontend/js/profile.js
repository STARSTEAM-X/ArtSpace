// ------------------ โหลดข้อมูลโปรไฟล์ ------------------ //
async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        window.location.href = "./index.html";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/profile/myprofile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("โหลดข้อมูลล้มเหลว");

        const data = await res.json();

        // ข้อมูลผู้ใช้
        document.getElementById("profileImg").src = BASE_URL + data.profileImg;
        document.getElementById("nickname").textContent = data.nickname;
        document.getElementById("bio").textContent = data.bio || '"ยังไม่มี Bio"';
        document.getElementById("username").textContent = data.username;
        document.getElementById("email").textContent = data.email;
        document.getElementById("fullname").textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById("dob").textContent = new Date(data.dateOfBirth).toLocaleDateString();
        document.getElementById("avgScore").textContent = data.averageScore.toFixed(1);

        // Stars
        document.getElementById("stars").textContent = "⭐".repeat(Math.round(data.averageScore));

        // Counters
        document.getElementById("joinedCount").textContent = data.joinedActivities.length;
        document.getElementById("createdCount").textContent = data.createdActivities.length;
        document.getElementById("postedCount").textContent = data.postedActivities.length;

        // Gallery
        const galleryList = document.getElementById("galleryList");
        if (!data.galleryList || data.galleryList.length === 0) {
            galleryList.innerHTML = "<p>ยังไม่มีรูปในแกลเลอรี่ ❌</p>";
        } else {
            galleryList.innerHTML = data.galleryList.map(img => `
                <img src="${BASE_URL + img}" alt="gallery">
            `).join("");
        }

        // Joined
        const joinedList = document.getElementById("joinedList");
        joinedList.innerHTML = data.joinedActivities.length === 0
            ? "<p>ยังไม่มีกิจกรรมเข้าร่วม ❌</p>"
            : data.joinedActivities.map(a => `
                <div class="activity-card">
                    <img src="${BASE_URL + a.imageUrl}" alt="">
                    <h4>${a.activityName}</h4>
                    <p>${new Date(a.activityDateStart).toLocaleDateString()}</p>
                </div>
            `).join("");

        // Created
        const createdList = document.getElementById("createdList");
        createdList.innerHTML = data.createdActivities.length === 0
            ? "<p>ยังไม่มีกิจกรรมที่สร้าง ❌</p>"
            : data.createdActivities.map(a => `
                <div class="activity-card">
                    <img src="${BASE_URL + a.imageUrl}" alt="">
                    <h4>${a.activityName}</h4>
                    <p>${new Date(a.activityDateStart).toLocaleDateString()}</p>
                </div>
            `).join("");

        // Posted
        const postedList = document.getElementById("postedList");
        postedList.innerHTML = data.postedActivities.length === 0
            ? "<p>ยังไม่มีโพสต์</p>"
            : data.postedActivities.map(p => `<p>📌 ${p.title}</p>`).join("");

    } catch (err) {
        console.error(err);
        alert("Error loading profile");
    }
}

document.addEventListener("DOMContentLoaded", loadProfile);


// ------------------ Modal Change Password ------------------ //
const modal = document.getElementById("changePasswordModal");
const closeBtn = document.getElementById("closeChangePassword");
const cancelBtn = document.getElementById("cancelChangePassword");
const form = document.getElementById("changePasswordForm");

const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");

document.querySelector(".btn-gray").addEventListener("click", () => {
    openChangePasswordModal();
});

function openChangePasswordModal() {
    modal.style.display = "flex";
    successMsg.style.display = "none";
    errorMsg.style.display = "none";
    form.reset();
}

closeBtn.onclick = () => modal.style.display = "none";
cancelBtn.onclick = () => modal.style.display = "none";

// Submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        const res = await fetch(`${BASE_URL}/api/auth/changepassword`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
        });

        const data = await res.json();

        if (res.ok) {
            successMsg.style.display = "flex";
            errorMsg.style.display = "none";
        } else {
            successMsg.style.display = "none";
            errorMsg.style.display = "flex";
            errorMsg.querySelector("span").textContent = data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
        }
    } catch (err) {
        console.error("Error:", err);
        successMsg.style.display = "none";
        errorMsg.style.display = "flex";
        errorMsg.querySelector("span").textContent = "เกิดข้อผิดพลาด กรุณาลองใหม่";
    }
});


// ---------------- Edit Profile Modal ---------------- //
const editModal = document.getElementById("editProfileModal");
const closeEditBtn = document.getElementById("closeEditProfile");
const cancelEditBtn = document.getElementById("cancelEditProfile");
const editForm = document.getElementById("editProfileForm");

// เปิด Modal
document.getElementById("openEditProfile").addEventListener("click", () => {
    editModal.style.display = "flex";
    document.getElementById("editNickname").value = document.getElementById("nickname").textContent;
    document.getElementById("editBio").value = document.getElementById("bio").textContent.replace(/"/g, "");
    document.getElementById("editProfileImgPreview").src = document.getElementById("profileImg").src;
});

closeEditBtn.onclick = () => editModal.style.display = "none";
cancelEditBtn.onclick = () => editModal.style.display = "none";

// Preview รูปก่อนอัปโหลด
document.getElementById("editProfileImg").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById("editProfileImgPreview").src = reader.result;
        };
        reader.readAsDataURL(file);
    }
});

// Submit
editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const formData = new FormData(editForm);

    try {
        const res = await fetch(`${BASE_URL}/api/profile/update`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            alert("อัปเดตโปรไฟล์สำเร็จ");
            editModal.style.display = "none";
            loadProfile();
        } else {
            alert(data.message || "อัปเดตไม่สำเร็จ");
        }
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
    }
});


// ---------------- Edit Gallery Modal ---------------- //
const editGalleryModal = document.getElementById("editGalleryModal");
const galleryPreview = document.getElementById("galleryPreview");
const newGalleryFiles = document.getElementById("newGalleryFiles");

let currentGallery = [];

document.getElementById("editGalleryBtn").addEventListener("click", () => {
    openEditGallery();
});

document.getElementById("closeGallery").onclick = () => editGalleryModal.style.display = "none";
document.getElementById("cancelGallery").onclick = () => editGalleryModal.style.display = "none";

function openEditGallery() {
    editGalleryModal.style.display = "flex";
    galleryPreview.innerHTML = "";

    fetch(`${BASE_URL}/api/profile/myprofile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
        .then(res => res.json())
        .then(data => {
            currentGallery = [...data.galleryList];
            renderGallery();
        });
}

function renderGallery() {
    galleryPreview.innerHTML = currentGallery.map(img => `
        <div class="img-box">
            <img src="${BASE_URL + img}" alt="">
            <button class="remove-btn" data-path="${img}">&times;</button>
        </div>
    `).join("");

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const path = btn.getAttribute("data-path");
            currentGallery = currentGallery.filter(g => g !== path);
            renderGallery();
        });
    });
}

// Save gallery
document.getElementById("saveGallery").addEventListener("click", async () => {
    const formData = new FormData();

    // ✅ เก็บ list ของรูปเก่าที่เหลือ
    formData.append("keepGallery", JSON.stringify(currentGallery));

    // ✅ เพิ่มไฟล์ใหม่ทั้งหมด
    for (let file of newGalleryFiles.files) {
        formData.append("files", file);
    }

    try {
        const res = await fetch(`${BASE_URL}/api/profile/updateGallery`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            alert("อัปเดตแกลเลอรี่สำเร็จ");
            editGalleryModal.style.display = "none";
            location.reload();
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
    }
});



// Preview ไฟล์ใหม่ที่เลือก
newGalleryFiles.addEventListener("change", () => {
    const files = Array.from(newGalleryFiles.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const div = document.createElement("div");
            div.classList.add("img-box");
            div.innerHTML = `
                <img src="${reader.result}" alt="">
                <button class="remove-btn">&times;</button>
            `;

            // ❌ ปุ่ม remove (ลบออกจาก newGalleryFiles preview เท่านั้น)
            div.querySelector(".remove-btn").addEventListener("click", () => {
                div.remove();
            });

            galleryPreview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});
