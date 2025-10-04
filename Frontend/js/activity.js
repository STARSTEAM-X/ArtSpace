// ====== STATE & ELEMENTS ======
const container = document.getElementById("activitiesContainer");
const modal = document.getElementById("activityModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

const modalManage = document.getElementById("modalManage");
const modalManageBody = document.getElementById("modalManageBody");


const searchInput = document.getElementById("searchInput");
const btnSearch = document.querySelector(".btn-search");
const categoryBtn = document.getElementById("categoryBtn");
const sortBtn = document.getElementById("sortBtn");

let allActivities = [];
let selectedCategory = ""; // Visual Arts / Photography / Writing / Music
let sortBy = "";           // "participants" | "date"

//image
document.getElementById("activityImage").addEventListener("change", e => {
  const file = e.target.files[0];
  const img = document.getElementById("previewImage");
  if (!file) {
    img.style.display = "none";
    img.src = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    img.src = ev.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
});



//category
const categoryButtons = document.querySelectorAll(".category-select button");
const hiddenInput = document.getElementById("activityType");

categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        // เอา active ออกจากปุ่มอื่น
        categoryButtons.forEach(b => b.classList.remove("active"));

        // ใส่ active ให้ปุ่มที่เลือก
        btn.classList.add("active");

        // เก็บค่าใส่ hidden input
        hiddenInput.value = btn.dataset.value;
    });
});

function getCurrentUserName() {
    try {
        const userStr = localStorage.getItem("loggedInUser");
        if (!userStr) return "";
        const user = JSON.parse(userStr);
        return user.username || "";
    } catch (err) {
        console.error("Error parsing loggedInUser:", err);
        return "";
    }
}

// ====== LOAD & RENDER ======
async function loadActivities() {
    try {
        const res = await fetch(`${BASE_URL}/api/activity/list`);
        if (!res.ok) throw new Error("โหลดกิจกรรมล้มเหลว");
        allActivities = await res.json();
        applyFilters(); // โหลดครั้งแรกก็เรนเดอร์ด้วยเงื่อนไขปัจจุบัน (ว่าง ๆ)
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red;">ไม่สามารถโหลดกิจกรรมได้</p>`;
    }
}
function getactivityTypeIcon(activityType) {
    const iconMap = {
        'Visual Arts': '/img/VisualArts.png',
        'Photography': '/img/photo.png',
        'Writing': '/img/writ.png',
        'Music': '/img/music.png'
    };
    return iconMap[activityType] || '/img/logo.png';
}
function mapTagClass(type) {
    switch (type) {
        case "Visual Arts": return "visual";
        case "Music": return "music";
        case "Photography": return "photo";
        case "Writing": return "writing";
        default: return "other";
    }
}

async function getCurrentUser() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Token invalid");
        return await res.json();
    } catch (err) {
        console.error("❌ Error fetching user info:", err);
        return null;
    }
}


async function renderActivities(list) {
    const currentUser = await getCurrentUser();

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <img class="empty-ill" src="/img/notfound.png" alt="">
                <p>ขออภัยไม่มีกิจกรรมที่คุณค้นหาในตอนนี้</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list
        .slice()
        .reverse()
        .map(act => {
            let actionButton = "";

            // ✅ กรณีล็อกอินแล้ว
            if (currentUser) {
                const username = currentUser.username;
                const isOwner = act.createdBy.username === username;
                const isJoined = act.userJoined.includes(username);
                const isRegistered = act.userRegistered.includes(username);

                if (isOwner) {
                    actionButton = `
                        <button class="btn btn-small manage" onclick="openManageActivity(${act.id})">Manage</button>
                        <div id="modalManage" class="modal">
                            <div class="modal-content" id="modalManageBody">
                                <span id="modalManageClose" class="close">&times;</span>
                            </div>
                        </div>
                        `;
                } else if (isJoined || isRegistered) {
                    actionButton = `
                        <button class="btn btn-small leave"
                                onclick="leaveActivity(${act.id})">Leave</button>`;
                } else {
                    actionButton = `
                        <button class="btn btn-small join"
                                onclick="joinActivity(${act.id})">Join Now</button>`;
                }
            }
            // ✅ กรณีไม่ได้ล็อกอิน
            else {
                actionButton = `
                    <button class="btn btn-small join" onclick="joinActivity(${act.id})" disabled>Join Now</button>`;
            }

            return `
                <div class="card-body">
                    <span class="pill-head ${mapTagClass(act.activityType)}">
                        <img src="${getactivityTypeIcon(act.activityType)}" alt="" width="16">
                        ${act.activityType}
                    </span>

                    <div class="title-head ${mapTagClass(act.activityType)}">
                        ${act.activityName}
                    </div>

                    <img class="cover" 
                         src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/300x150"}" 
                         alt="">

                    <div class="info-stack">
                        <div class="info-row">
                            <img src="/img/position.png" class="info-row-image" height="20" alt="">
                            <div class="info-chip">${act.location}</div>
                        </div>
                        <div class="info-row">
                            <img src="/img/calendar.png" class="info-row-image" height="20" alt="">
                            <div class="info-chip">${formatDate(act.activityDateStart)} - ${formatDate(act.activityDateEnd)}</div>
                        </div>
                        <div class="info-row">
                            <img src="/img/time.png" class="info-row-image" height="20" alt="">
                            <div class="info-chip">${act.activityTimeStart} - ${act.activityTimeEnd}</div>
                        </div>
                    </div>

                    <div class="count-badge status ${act.currentParticipants < act.maxParticipants ? "success" : "danger"}">
                        <img class="image-count-badge" src="/img/account.png" width="18" height="18" alt=""> 
                        ${act.currentParticipants}/${act.maxParticipants}
                    </div>     

                    <div class="org">
                        <img class="btn-img" 
                             src="${BASE_URL + act.createdBy.profileImg}" alt="img" onclick="viewProfile('${act.createdBy.username}')">
                        <div class="org-info">
                            <p class="nickname">${act.createdBy.nickname}</p>
                            <div class="org-rating">
                                <p>${act.createdBy.averageScore}</p>
                                <div class="rating" data-score="${act.createdBy.averageScore}"></div>
                            </div> 
                        </div>
                    </div>

                    <div class="actions-cardAct">
                        <button class="btn btn-small btn-ghost detail" onclick="viewDetail(${act.id})">More Detail</button>
                        ${actionButton}
                    </div>
                </div>
            `;
        }).join("");

    renderStars();
}


// ====== FILTER / SORT / SEARCH ======
function applyFilters() {
    let list = [...allActivities];

    // คำค้น
    const kw = (searchInput.value || "").trim().toLowerCase();
    if (kw) {
        list = list.filter(a =>
            (a.activityName || "").toLowerCase().includes(kw) ||
            (a.createdByUserName || "").toLowerCase().includes(kw)
        );
    }

    // หมวดหมู่
    if (selectedCategory) {
        list = list.filter(a => (a.activityType || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // เรียงลำดับ
    if (sortBy === "participants") {
        list.sort((a, b) => (b.currentParticipants - a.currentParticipants));
    } else if (sortBy === "date") {
        list.sort((a, b) => new Date(a.activityDateStart) - new Date(b.activityDateStart));
    }

    // เรทติ้ง
    if (sortBy === "rating") {
        const score = x => Number(x?.createdBy?.averageScore) || 0;
        list.sort((a, b) => score(a) - score(b));
    }

    renderActivities(list);
}

// ====== MODAL DETAIL ======

// View Detail
async function viewDetail(id) {
    try {
        const currentUser = await getCurrentUser();

        // ✅ โหลดรายละเอียดกิจกรรม
        const res = await fetch(`${BASE_URL}/api/activity/detail/${id}`);
        if (!res.ok) throw new Error("โหลดรายละเอียดกิจกรรมล้มเหลว");
        const act = await res.json();

        // ✅ ตรวจสอบสถานะ
        const currentUserName = currentUser ? currentUser.username : null;
        const ownerName = act.createdBy.username || act.createdByUserName || "";
        const isOwner = currentUserName === ownerName;
        const isJoined =
            act.userJoined?.includes(currentUserName) ||
            act.userRegistered?.includes(currentUserName) ||
            act.isJoined === true;

        console.log("=== Debug Info ===");
        console.log("Current Username:", currentUserName);
        console.log("Owner Activity:", ownerName);
        console.log("Is Owner:", isOwner, "Is Joined:", isJoined);
        console.log("Activity ID:", act.id);
        console.log("Activity detail object =", act);

        const participantClass = isJoined ? "participants-joined" : "participants-not-joined";
        const ImgparticipantClass = isJoined ? "/img/account-black.png" : "/img/account.png";

        // ✅ เลือกปุ่มให้เหมาะสม
        let actionHtml = "";
        if (!currentUser) {
            actionHtml = `<button class="btn-join-activity join" disabled>Login to Join</button>`;
        } else if (isOwner) {
            actionHtml = `
                <button class="btn-manage-activity manage" onclick="openManageActivity(${act.id})">Manage</button>
                <div id="modalManage" class="modal">
                    <div class="modal-content" id="modalManageBody">
                        <span id="modalManageClose" class="close">&times;</span>
                    </div>
                </div>
            `;
        } else if (isJoined) {
            actionHtml = `<button class="btn-leave-activity leave" onclick="leaveActivity(${act.id})">Leave Activity</button>`;
        } else {
            actionHtml = `<button class="btn-join-activity join" onclick="joinActivity(${act.id})">Join Now</button>`;
        }

        // ✅ สร้าง UI
        modalBody.innerHTML = `
        <div class="type-more">
            <span class="pill-category-modal ${mapTagClass(act.activityType)}">
                <img src="${getactivityTypeIcon(act.activityType)}" alt="" width="16">
                ${act.activityType}
            </span>
        </div>

        <div class="activity-modal-detail">
            <div class="modal-header-section">
                <h2 class="modal-activity-title ${mapTagClass(act.activityType)}">${act.activityName}</h2>
            </div>

            <div class="modal-content-wrapper">
                <div class="modal-left-side">
                    <img src="${act.imageUrl ? BASE_URL + act.imageUrl : "https://via.placeholder.com/500x250"}" 
                         alt="Activity" class="modal-activity-image">
                    
                    <p class="organizer-label">ผู้จัดกิจกรรม :</p>
                    <div class="organizer-info">
                        <div class="org organizer-info">
                            <img class="btn-img" 
                                src="${BASE_URL + act.createdBy.profileImg}" alt="img" onclick="viewProfile('${act.createdBy.username}')">
                            <div class="org-info">
                                <p class="nickname">${act.createdBy.nickname}</p>
                                <div class="org-rating">
                                    <p>${act.createdBy.averageScore}</p>
                                    <div class="rating" data-score="${act.createdBy.averageScore}"></div>
                                </div> 
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-right-side">
                    <div class="modal-description">
                        <p>${act.activityDescription || "-"}</p>
                    </div>
                    
                    <div class="participants-wrapper">
                        <div class="participants-badge ${participantClass}">
                            <img src="${ImgparticipantClass}" alt="participants" width="24" height="24">
                            <span class="participants-count">${act.currentParticipants}/${act.maxParticipants}</span>
                        </div>
                        ${isJoined ? '<span class="joined-indicator"></span>' : ''}
                    </div>
                    
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <img src="/img/position.png" alt="location" width="20" height="20">
                            <span class="info-label-text">สถานที่ :</span>
                            <span class="info-value-text">${act.location}</span>
                        </div>
                        
                        <div class="modal-info-item">
                            <img src="/img/calendar.png" alt="date" width="20" height="20">
                            <span class="info-label-text">เริ่ม :</span>
                            <span class="info-value-text">${formatDate(act.activityDateStart)}</span>
                        </div>
                        
                        <div class="modal-info-item">
                            <img src="/img/time.png" alt="time" width="20" height="20">
                            <span class="info-label-text">เวลา :</span>
                            <span class="info-value-text">${act.activityTimeStart} - ${act.activityTimeEnd}</span>
                        </div>
                        
                        <div class="modal-info-item">
                            <img src="/img/time.png" alt="time" width="20" height="20">
                            <span class="info-label-text">ปิดรับประกาศ :</span>
                            <span class="info-value-text">${formatDate(act.announceDateEnd)} - ${act.announceTimeEnd}</span>
                        </div>
                    </div>
                    
                    <div class="modal-action-button">
                        ${actionHtml}
                    </div>
                </div>
            </div>
        </div>
        `;

        modal.style.display = "flex";
        renderStars();
    } catch (err) {
        console.error("❌ viewDetail error:", err);
        alert("ไม่สามารถโหลดรายละเอียดได้");
    }
}

//====== star (rating)======
function renderStars() {
    document.querySelectorAll(".rating").forEach(rating => {
        const score = parseFloat(rating.dataset.score) || 0;
        const fullStars = Math.floor(score);         // ดาวเต็ม
        const halfStar = score % 1 >= 0.5;           // ครึ่งดาว
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let starsHtml = "";

        // ⭐ ดาวเต็ม
        for (let i = 0; i < fullStars; i++) {
            starsHtml += `<img src="img/star.png" alt="★">`;
        }
        // 🌗 ครึ่งดาว
        if (halfStar) {
            starsHtml += `<img src="img/star-half.png" alt="☆">`;
        }
        // ☆ ดาวว่าง
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += `<img src="img/star-gray.png" alt="☆">`;
        }

        rating.innerHTML = starsHtml;
    });
}



// ======เปิดหน้า Manage Activity (สำหรับเจ้าของ) ======
async function openManageActivity(activityId) {
    try {
        const res = await fetch(`${BASE_URL}/api/activity/detail/${activityId}`);
        if (!res.ok) throw new Error("โหลดรายละเอียดกิจกรรมล้มเหลว");
        const act = await res.json();
        const modalManage = document.getElementById("modalManage");
        const modalManageBody = document.getElementById("modalManageBody");
        console.log(modalManage);
        console.log(modalManageBody);


        // ใส่ HTML เนื้อหา Manage Activity
        modalManageBody.innerHTML = `

            <!-- ฟอร์มบน -->

            <span id="modalManageClose" class="close">&times;</span>
                <form id="manageActivityForm" enctype="multipart/form-data">
                    <h2 class="header-manage">Manage Activity</h2>
                    <label class="nameAct">
                        ชื่อกิจกรรม :
                        <input type="text" name="ActivityName" value="${act.activityName}" required>
                    </label>

                    <label class="full">
                        รายละเอียด :
                        <textarea name="ActivityDescription" rows="3">${act.activityDescription}</textarea>
                    </label>

                    <div class="dateandtime-row">
                        <label>
                            วันที่เริ่ม :
                            <div class="input-with-icon">
                                <input type="date" name="ActivityDateStart" value="${formatDate(act.activityDateStart)}">
                                <img src="/img/calendar.png" alt="calendar icon">
                            </div>
                        </label>

                        <label class="dateandtimeblock">
                            เวลาเริ่ม :
                            <div class="input-with-icon">
                                <input type="time" name="ActivityTimeStart" value="${act.activityTimeStart}">
                                <img src="/img/time.png" alt="clock icon">
                            </div>
                        </label>
                    </div>

                    <div class="dateandtime-row">
                        <label>
                            วันที่สิ้นสุด :
                            <div class="input-with-icon">
                                <input type="date" name="ActivityDateEnd" value="${formatDate(act.activityDateEnd)}">
                                <img src="/img/calendar.png" alt="calendar icon">
                            </div>
                        </label>
                        <label class="dateandtimeblock">
                            เวลาสิ้นสุด :
                            <div class="input-with-icon">
                                <input type="time" name="ActivityTimeEnd" value="${act.activityTimeEnd}">
                                <img src="/img/time.png" alt="clock icon">
                            </div>
                        </label>
                    </div>

                    <label class="loca">
                        สถานที่ :
                        <div class="input-with-icon">
                            <input name="location-manage" value="${act.location}" required>
                        </div>
                    </label>
                    <label>
                        จำนวนสูงสุด :
                        <div class="input-with-icon people">
                            <input type="number" name="MaxParticipants" value="${act.maxParticipants}" required>
                            <img src="/img/people.png" alt="clock icon">
                        </div>
                    </label>

                    <div class="dateandtime-row">
                        <label>
                            วันปิดรับประกาศ :
                            <div class="input-with-icon">
                                <input type="date" name="AnnounceDateEnd" value="${formatDate(act.announceDateEnd)}">
                                <img src="/img/calendar.png" alt="calendar icon">
                            </div>
                        </label>
                        <label class="dateandtimeblock">
                            เวลาปิดรับประกาศ :
                            <div class="input-with-icon">
                                <input type="time" name="AnnounceTimeEnd" value="${act.announceTimeEnd}">
                                <img src="/img/time.png" alt="clock icon">
                            </div>
                        </label>
                    </div>
                    <div class="category">
                        <span>กรุณาเลือกหมวด :</span>
                        <div class="category-select">
                            <button type="button" class="sign visual" data-value="Visual Arts">
                                <p><img src="/img/VisualArts.png" alt="Visual Arts">Visual Arts</p>
                            </button>

                            <button type="button" class="sign photo" data-value="Photography">
                                <p><img src="/img/photo.png" alt="Photography">Photography</p>

                            </button>

                            <button type="button" class="sign writing" data-value="Writing">
                                <p><img src="/img/writ.png" alt="Writing">Writing</p>

                            </button>

                            <button type="button" class="sign music" data-value="Music">
                                <p><img src="/img/music.png" alt="Music">Music</p>
                            </button>
                        </div>
                        <input type="hidden" name="activityType" id="activityType">
                    </div>

                    <div class="upload-img">
                        <label for="activityImage">รูปกิจกรรม :</label>

                        <label class="upload-btn">
                            <img src="/img/upimg.png" alt="upload icon">
                            <span>อัปโหลดรูปโปรไฟล์</span>
                            <input type="file" id="activityImage" name="activityImage" accept="image/*">
                        </label>

                        <div class="preview-box">
                            <img id="previewImagee" 
                            src="${act.imageUrl ? BASE_URL + act.imageUrl : 'https://via.placeholder.com/120'}" 
                            alt="preview">
                        </div>
                    </div>


                    

                </form>




                <!-- ฟอร์มล่าง -->


                <form id="joined-manageActivityForm">
                    <div class="manage-container">
                        <div class="control-bar">
                            <div class="dropdown">
                                <button class="dropbtn">▾ เรียงตาม</button>
                                <div class="dropdown-content">
                                    <div class="sort-rating-manage"><button data-sort="rating">เรตติ้งผู้จัดกิจกรรม</button></div>
                                    <div class="sort-joined"><button data-sort="date">วันที่กิจกรรม</button></div>
                                </div>
                            </div>
                            <button class="btn-clear">เคลียร์ผลเลือก</button>
                            <button class="btn-auto">สุ่มอัตโนมัติ</button>
                        </div>
                        <div class="right-counter">
                            <img src="img/account.png">
                            <span>2/5</span>
                        </div>
                    </div>


                    <!-- ผู้เข้าร่วม -->


                    <div class="participants-grid">
                        <div class="participant-card accepted">
                            <div class="card-left">
                                <img class="avatar" src="img/backgroup_purple.jpg" alt="user">
                            </div>

                            <div class="card-center">
                                <p class="nickname">ไข่ไก่น่ารักที่สุดเลย</p>
                                <p class="username">@Cutekhai</p>
                                <div class="rating">
                                    <img src="img/star.png" width="16"><span>5.0</span>
                                </div>
                            </div>

                            <div class="card-right">
                                <div class="status">Accept</div>
                                <div class="actions">
                                    <button class="btn-reject">Reject</button>
                                    <button class="btn-accept">Accept</button>
                                </div>
                            </div>
                        </div>

                            <!-- เทสเลเอาท์ -->

                        <div class="participant-card accepted">
                            <div class="card-left">
                                <img class="avatar" src="img/backgroup_purple.jpg" alt="user">
                            </div>

                            <div class="card-center">
                                <p class="nickname">ไข่ไก่น่ารักที่สุดเลย</p>
                                <p class="username">@Cutekhai</p>
                                <div class="rating">
                                    <img src="img/star.png" width="16"><span>5.0</span>
                                </div>
                            </div>

                            <div class="card-right">
                                <div class="status">Accept</div>
                                <div class="actions">
                                    <button class="btn-reject">Reject</button>
                                    <button class="btn-accept">Accept</button>
                                </div>
                            </div>
                        </div>
                        <div class="participant-card accepted">
                            <div class="card-left">
                                <img class="avatar" src="img/backgroup_purple.jpg" alt="user">
                            </div>

                            <div class="card-center">
                                <p class="nickname">ไข่ไก่น่ารักที่สุดเลย</p>
                                <p class="username">@Cutekhai</p>
                                <div class="rating">
                                    <img src="img/star.png" width="16"><span>5.0</span>
                                </div>
                            </div>

                            <div class="card-right">
                                <div class="status">Accept</div>
                                <div class="actions">
                                    <button class="btn-reject">Reject</button>
                                    <button class="btn-accept">Accept</button>
                                </div>
                            </div>
                        </div>
                        <div class="participant-card accepted">
                            <div class="card-left">
                                <img class="avatar" src="img/backgroup_purple.jpg" alt="user">
                            </div>

                            <div class="card-center">
                                <p class="nickname">ไข่ไก่น่ารักที่สุดเลย</p>
                                <p class="username">@Cutekhai</p>
                                <div class="rating">
                                    <img src="img/star.png" width="16"><span>5.0</span>
                                </div>
                            </div>

                            <div class="card-right">
                                <div class="status">Accept</div>
                                <div class="actions">
                                    <button class="btn-reject">Reject</button>
                                    <button class="btn-accept">Accept</button>
                                </div>
                            </div>
                        </div>



                    </div>


                    <div class="ActionsAct-manage">
                        <button type="button" id="manageCancel" class="btn-gray" onclick="">CANCEL</button>
                        <button type="submit" id="manageSave" class="btn-yellow" onclick="" >SAVE</button>
                    </div>
                </form>
            `;
        modalManage.style.display = "flex";


        const categoryButtons = document.querySelectorAll(".category-select button");
        const hiddenInput = document.getElementById("activityType");

        categoryButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                // เอา active ออกจากปุ่มอื่น
                categoryButtons.forEach(b => b.classList.remove("active"));

                // ใส่ active ให้ปุ่มที่เลือก
                btn.classList.add("active");

                // เก็บค่าใส่ hidden input
                hiddenInput.value = btn.dataset.value;
            });
        });

        //อัปรูป
        const fileInput = document.getElementById("activityImage");
        const preview = document.getElementById("previewImagee");

        fileInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) {
            preview.style.display = "none";
            preview.src = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
            preview.src = ev.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
        });




        // ปิด modal เมื่อกดปุ่มปิด
        document.getElementById("modalManageClose").onclick = () => {
            modalManage.style.display = "none";
        };

        // ปิด modal เมื่อกดนอกกล่อง
        window.onclick = (e) => {
            if (e.target === modalManage) {
                modalManage.style.display = "none";
            }
        };

        document.getElementById("manageCancel").onclick = () => {
            modalManage.style.display = "none";
        }

        const form = document.getElementById("manageActivityForm");
        form.onsubmit = async (e) => {
            e.preventDefault();

            const token = localStorage.getItem("token");
            if (!token) {
                alert("กรุณาเข้าสู่ระบบก่อน");
                return;
            }

            // เก็บค่าจาก form
            const formData = new FormData(form);

            try {
                const updateRes = await fetch(`${BASE_URL}/api/activity/update/${activityId}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`
                        // ❌ อย่าใส่ "Content-Type": "application/json"
                    },
                    body: formData
                });

                // ถ้า backend ไม่ส่ง body กลับมา → อย่า parse เป็น JSON ทันที
                let data = null;
                try {
                    data = await updateRes.json();
                } catch (_) {
                    // กรณี backend ไม่ส่ง JSON
                }

                if (updateRes.ok) {
                    alert("อัปเดตกิจกรรมสำเร็จ");
                    modalManage.style.display = "none";
                    await loadActivities(); // refresh list
                } else {
                    alert("อัปเดตไม่สำเร็จ: " + (data?.message || "unknown error"));
                }
            } catch (err) {
                console.error("❌ update error:", err);
                alert("เกิดข้อผิดพลาด ไม่สามารถอัปเดตได้");
            }
        };


        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-accept")) {
                const card = e.target.closest(".participant-card");
                card.classList.remove("pending", "rejected");
                card.classList.add("accepted");
                card.querySelector(".status").textContent = "Accept";
            }
            if (e.target.classList.contains("btn-reject")) {
                const card = e.target.closest(".participant-card");
                card.classList.remove("pending", "accepted");
                card.classList.add("rejected");
                card.querySelector(".status").textContent = "Reject";
            }
        });

        // สุ่มยอมรับอัตโนมัติ
        document.querySelector(".btn-auto")?.addEventListener("click", () => {
            const cards = document.querySelectorAll(".participant-card");
            cards.forEach(card => {
                if (Math.random() > 0.5) {
                    card.classList.remove("pending", "rejected");
                    card.classList.add("accepted");
                    card.querySelector(".status").textContent = "Accept";
                } else {
                    card.classList.remove("pending", "accepted");
                    card.classList.add("rejected");
                    card.querySelector(".status").textContent = "Reject";
                }
            });
        });

        // เคลียร์ผลการเลือก
        document.querySelector(".btn-clear")?.addEventListener("click", () => {
            const cards = document.querySelectorAll(".participant-card");
            cards.forEach(card => {
                card.classList.remove("accepted", "rejected");
                card.classList.add("pending");
                card.querySelector(".status").textContent = "Pending";
            });
        });





    } catch (err) {
        console.error("❌ openManageActivity error:", err);
        alert("ไม่สามารถเปิดหน้า Manage Activity ได้");
    }
}





// ====== LEAVE ACTIVITY ======
async function leaveActivity(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนออกจากกิจกรรม");
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/api/activity/leave`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ activityId: id })
        });
        const data = await res.json();
        if (res.ok) {
            alert("ออกจากกิจกรรมสำเร็จ");
            modal.style.display = "none"; // ปิด modal
            await loadActivities(); // รีโหลดข้อมูล
        } else {
            alert("ไม่สามารถออกจากกิจกรรม: " + (data.message || "unknown"));
        }
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
    }
}


// ====== JOIN ======
async function joinActivity(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม");
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/api/activity/join`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ activityId: id })
        });
        const data = await res.json();
        console.log("jvdaljakd", data);
        if (res.ok) {
            alert("เข้าร่วมกิจกรรมสำเร็จ");
            await loadActivities(); // รีโหลดข้อมูลให้ตัวเลขผู้เข้าร่วมอัปเดต
        } else {
            alert("ไม่สามารถเข้าร่วม: " + (data.message || "unknown"));
        }
        await viewDetail(id);
    } catch (err) {
        console.error(err);
    }
}

// ====== DROPDOWN: เปิด-ปิดด้วยคลิก & เลือกแล้วปิดทันที ======
document.querySelectorAll(".dropdown .dropbtn").forEach(btn => {
    btn.addEventListener("click", e => {
        e.stopPropagation();
        const parent = btn.parentElement;
        document.querySelectorAll(".dropdown").forEach(d => {
            if (d !== parent) d.classList.remove("open");
        });
        parent.classList.toggle("open");
    });
});

// เลือก "หมวดหมู่"
document.querySelectorAll(".dropdown .dropdown-content .tag").forEach(item => {
    item.addEventListener("click", e => {
        const parent = item.closest(".dropdown");
        parent.classList.remove("open");

        // ชื่อหมวดหมู่ (ตัดช่องว่าง/ไอคอน)
        const cat = item.innerText.trim();
        // toggle: กดซ้ำ = ล้างตัวกรอง
        if (selectedCategory === cat) {
            selectedCategory = "";
            categoryBtn.textContent = "▾ หมวดหมู่";
        } else {
            selectedCategory = cat;
            categoryBtn.textContent = cat;
        }
        applyFilters();
    });
});

// เลือก "เรียงลำดับ"
(() => {
    const sortDropdown = sortBtn.parentElement;
    sortDropdown.querySelectorAll(".dropdown-content button").forEach(btn => {
        btn.addEventListener("click", () => {
            sortDropdown.classList.remove("open");

            const label = btn.innerText.trim();
            sortBtn.textContent = "▾ " + label;

            // เก็บค่าจาก data-sort
            sortBy = btn.dataset.sort;  // "rating" | "participants" | "date"
            applyFilters();
        });
    });
})();


// ปิด dropdown เมื่อคลิกนอก
window.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
});

// ====== SEARCH EVENTS ======
btnSearch.addEventListener("click", applyFilters);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") applyFilters(); });

// ====== HELPERS ======
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", loadActivities);
// ปิด modal
modalClose.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });


// ===== HERO BUTTONS =====
const btnFind = document.getElementById("btnFind");
const btnCreate = document.getElementById("btnCreate");
const searchBar = document.querySelector(".search-bar");
const createModal = document.getElementById("createModal");
const createClose = document.getElementById("createClose");
const cancleact = document.getElementById("cancle-act");
const fileInput = document.getElementById("activityImage");
const preview = document.getElementById("previewImage");


// Find Activity → scroll ไป Search Bar
btnFind?.addEventListener("click", () => {
    searchBar.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Create Activity → เปิด modal
btnCreate?.addEventListener("click", () => {
    createModal.style.display = "flex";
});

// ปิด modal สร้างกิจกรรม
createClose?.addEventListener("click", () => {
    createModal.style.display = "none";
});
//image
cancleact?.addEventListener("click", () => {
    createModal.style.display = "none";
    fileInput.value = "";          // เคลียร์ไฟล์ที่เลือก
    preview.src = ""; 
    preview.style.display = "none";
});
window.addEventListener("click", e => {
    if (e.target === createModal) {
        createModal.style.display = "none";
    }
});

// ====== CREATE ACTIVITY ======
const createForm = document.getElementById("createActivityForm");

createForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม");
        return;
    }

    const formData = new FormData(createForm);

    try {
        const res = await fetch(`${BASE_URL}/api/activity/createactivity`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }, // ❗ ต้องมี token
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            alert("สร้างกิจกรรมสำเร็จ!");
            createForm.reset();
            createModal.style.display = "none";
            await loadActivities(); // refresh list ให้เห็นกิจกรรมใหม่
        } else {
            alert("สร้างกิจกรรมไม่สำเร็จ: " + (data.message || "unknown error"));
        }
    } catch (err) {
        console.error("Error creating activity:", err);
        alert("เกิดข้อผิดพลาด ไม่สามารถสร้างกิจกรรมได้");
    }
});
