// ------------------ โหลดข้อมูลโปรไฟล์คนอื่น ------------------ //
async function loadProfile() {

    // ✅ ดึง username จาก URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    
    if (!username) {
        alert("กรุณาระบุ username");
        window.location.href = "./index.html";
        return;
    }

    // ฟังก์ชันช่วยกำหนดไอคอน
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
        // ✅ โหลดโปรไฟล์คนอื่น (ไม่ต้องใช้ token)
        const res = await fetch(`${BASE_URL}/api/profile/user/${username}`);
        if (!res.ok) {
            if (res.status === 404) {
                alert("ไม่พบผู้ใช้นี้");
            } else {
                throw new Error("โหลดข้อมูลล้มเหลว");
            }
            window.location.href = "./index.html";
            return;
        }
        const data = await res.json();

        // ✅ โหลดโพสต์ของ user
        const res_post = await fetch(`${BASE_URL}/api/community/user/${data.username}`);
        if (!res_post.ok) throw new Error("โหลดโพสต์ล้มเหลว");
        const posts = await res_post.json();

        // ----------------- ข้อมูลผู้ใช้ -----------------
        document.getElementById("profileImg").src = data.profileImg
            ? BASE_URL + data.profileImg
            : "./img/profile.png";

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
        document.getElementById("postedCount").textContent = posts.length;

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

        // คลิกโพสต์ไปหน้า community
        document.querySelectorAll(".post-item").forEach(item => {
            item.addEventListener("click", () => {
                const id = item.dataset.id;
                window.location.href = `./community.html?id=${id}`;
            });
        });

    } catch (err) {
        console.error(err);
        alert("Error loading profile: " + err.message);
        window.location.href = "./index.html";
    }
}

document.addEventListener("DOMContentLoaded", loadProfile);

// ----------------  Navigation Arrows ---------------- //
function setupScrollArrows(wrapperId, listId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const list = wrapper.querySelector(`#${listId}`);
    const leftArrow = wrapper.querySelector('.left-arrow');
    const rightArrow = wrapper.querySelector('.right-arrow');
    
    if (!list || !leftArrow || !rightArrow) return;
    
    leftArrow.addEventListener('click', () => {
        list.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });
    
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
        setupScrollArrows('galleryWrapper', 'galleryList');
        setupScrollArrows('joinedWrapper', 'joinedList');
        setupScrollArrows('createdWrapper', 'createdList');
    });
});