const btn = document.getElementById("btn-toggle");
const body = document.body;

// โหลดสถานะธีมจาก localStorage ถ้ามี
if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-theme");
    btn.textContent = "☀️ สลับธีม";
}

btn.addEventListener("click", () => {
    body.classList.toggle("dark-theme");

    if (body.classList.contains("dark-theme")) {
        localStorage.setItem("theme", "dark");
        btn.textContent = "☀️ สลับธีม";
    } else {
        localStorage.setItem("theme", "light");
        btn.textContent = "🌙 สลับธีม";
    }
});
