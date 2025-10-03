// ------------------ โหลดข้อมูลโปรไฟล์ ------------------ //
async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        window.location.href = "./index.html";
        return;
    }

    // **********************************************
    // ✅ 1. เพิ่มฟังก์ชันช่วยกำหนดไอคอน
    // **********************************************
    function getActivityIcon(type) {
        if (!type) return '🌟'; 
        
        switch (type.toLowerCase()) {
            case 'visual art':
                return '🎨';
            case 'photo':
                return '📷';
            case 'writing':
                return '✍️';
            case 'music':
                return '🎵';
            default:
                return '🌟'; 
        }
    }


    try {
        const res = await fetch(`${BASE_URL}/api/profile/myprofile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("โหลดข้อมูลล้มเหลว");
        const data = await res.json();

        // ✅ โหลดโพสต์ของ user จาก Community API
        const res_post = await fetch(`${BASE_URL}/api/community/user/${data.username}`);
        if (!res_post.ok) throw new Error("โหลดโพสต์ล้มเหลว");
        const posts = await res_post.json();

        

        // ----------------- ข้อมูลผู้ใช้ -----------------
        document.getElementById("profileImg").src = data.profileImg
            ? BASE_URL + data.profileImg
            : "./img/profile.png";   // fallback

        document.getElementById("nickname").textContent = data.nickname || data.username;
        document.getElementById("bio").textContent = data.bio || '"ยังไม่มี Bio"';
        document.getElementById("username").textContent = data.username;
        document.getElementById("email").textContent = data.email;
        document.getElementById("fullname").textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById("dob").textContent = data.dateOfBirth
            ? new Date(data.dateOfBirth).toLocaleDateString()
            : "-";
        document.getElementById("avgScore").textContent = data.averageScore?.toFixed(1) ?? "0.0";

        // Stars
        document.getElementById("stars").textContent = "⭐".repeat(Math.round(data.averageScore || 0));

        // Counters
        document.getElementById("joinedCount").textContent = data.joinedActivities?.length || 0;
        document.getElementById("createdCount").textContent = data.createdActivities?.length || 0;
        document.getElementById("postedCount").textContent = posts.length; // ✅ ใช้ posts จาก API

        // ----------------- Gallery -----------------
        const galleryList = document.getElementById("galleryList");
        if (!data.galleryList || data.galleryList.length === 0) {
            galleryList.innerHTML = "<p>ยังไม่มีรูปในแกลเลอรี่ ❌</p>";
        } else {
            galleryList.innerHTML = data.galleryList.map(img => `
                <img src="${BASE_URL + img}" alt="gallery">
            `).join("");
        }

        // ----------------- Joined Activities -----------------
        const joinedList = document.getElementById("joinedList");
        joinedList.innerHTML = data.joinedActivities?.length === 0
            ? "<p>ยังไม่มีกิจกรรมเข้าร่วม ❌</p>"
            : data.joinedActivities.map(a => {
                const activityDate = new Date(a.activityDateStart);
                const today = new Date();
                const isPast = activityDate < today;
                const statusBadge = isPast
                    ? '<span class="badge done">Done</span>'
                    : '<span class="badge upcoming">Upcoming</span>';

                return `
                    <div class="activity-card">
                        <span class="category-badge"> ${a.activityType}</span>
                        ${statusBadge}
                        <h4>${a.activityName}</h4>
                        <img src="${a.imageUrl ? BASE_URL + a.imageUrl : './img/noimage.png'}" alt="${a.activityName}">
                        <p>${activityDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <button class="review-btn">Review</button>
                    </div>
                `;
            }).join("");

        // ----------------- Created Activities -----------------
        const createdList = document.getElementById("createdList");
        createdList.innerHTML = data.createdActivities?.length === 0
            ? "<p>ยังไม่มีกิจกรรมที่สร้าง ❌</p>"
            : data.createdActivities.map(a => {
                const activityDate = new Date(a.activityDateStart);
                const today = new Date();
                const isPast = activityDate < today;
                const statusBadge = isPast
                    ? '<span class="badge done">Done</span>'
                    : '<span class="badge upcoming">Upcoming</span>';

                return `
                    <div class="activity-card">
                        <span class="category-badge"> ${a.activityType}</span>
                        ${statusBadge}
                        <h4>${a.activityName}</h4>
                        <img src="${a.imageUrl ? BASE_URL + a.imageUrl : './img/noimage.png'}" alt="${a.activityName}">
                        <p>${activityDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <button class="review-btn">Manage</button>
                    </div>
                `;
            }).join("");

        // ----------------- Posted (จาก Community API) -----------------
        postedList.innerHTML = posts.length === 0
            ? "<p>ยังไม่มีโพสต์ ❌</p>"
            : posts.map(p => {
                const activityIcon = getActivityIcon(p.type || ''); 
                return `
                    <div class="post-item" data-id="${p.id}">
                        <span class="post-icon">${activityIcon}</span>
                        <span>${p.title}</span>
                    </div>
                `;
            }).join("");
        // redirect ไป community.html พร้อม id
        document.querySelectorAll(".post-item").forEach(item => {
            item.addEventListener("click", () => {
                const id = item.dataset.id;
                window.location.href = `./community.html?id=${id}`;
            });
        });

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
let newFilesToUpload = [];

document.getElementById("editGalleryBtn").addEventListener("click", () => {
    openEditGallery();
});

document.getElementById("closeGallery").onclick = () => editGalleryModal.style.display = "none";
document.getElementById("cancelGallery").onclick = () => editGalleryModal.style.display = "none";

function openEditGallery() {
    editGalleryModal.style.display = "flex";
    galleryPreview.innerHTML = "";
    newFilesToUpload = []; 

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
    newFilesToUpload.forEach(file => {
        formData.append("files", file);
    });

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
        // ✅ 1. เก็บไฟล์ลง array
        newFilesToUpload.push(file);
        
        const reader = new FileReader();
        reader.onload = () => {
            const div = document.createElement("div");
            div.classList.add("img-box");
            div.innerHTML = `
                <img src="${reader.result}" alt="">
                <button class="remove-btn" data-filename="${file.name}">&times;</button>
            `;

            // ✅ 2. ลบทั้ง preview และไฟล์จริงใน array
            div.querySelector(".remove-btn").addEventListener("click", () => {
                const filename = div.querySelector(".remove-btn").getAttribute("data-filename");
                newFilesToUpload = newFilesToUpload.filter(f => f.name !== filename);
                div.remove();
            });

            galleryPreview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    
    // ✅ 3. รีเซ็ต input เพื่อให้เลือกไฟล์ซ้ำได้
    newGalleryFiles.value = "";
});



// ----------------  Navigation Arrows ---------------- //
function setupScrollArrows(wrapperId, listId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const list = wrapper.querySelector(`#${listId}`);
    const leftArrow = wrapper.querySelector('.left-arrow');
    const rightArrow = wrapper.querySelector('.right-arrow');
    
    if (!list || !leftArrow || !rightArrow) return;
    
    // เลื่อนไปทางซ้าย
    leftArrow.addEventListener('click', () => {
        list.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });
    
    // เลื่อนไปทางขวา
    rightArrow.addEventListener('click', () => {
        list.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
}

// เรียกใช้หลังจากโหลดข้อมูลเสร็จ
document.addEventListener("DOMContentLoaded", () => {
    loadProfile().then(() => {
        // Setup navigation arrows สำหรับแต่ละ section
        setupScrollArrows('galleryWrapper', 'galleryList');
        setupScrollArrows('joinedWrapper', 'joinedList');
        setupScrollArrows('createdWrapper', 'createdList');
    });
});

