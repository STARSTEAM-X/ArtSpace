// notiWorker.js
let interval = null;

// รับข้อความจาก main thread
self.onmessage = function (e) {
    if (e.data.action === "start") {
        const url = e.data.url;
        const token = e.data.token;

        if (interval) clearInterval(interval);

        // ✅ refetch ทุก 1 วิ
        interval = setInterval(async () => {
            try {
                console.log("Worker fetching noti...");
                const res = await fetch(url, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch noti");

                const notis = await res.json();
                // ส่งกลับไปที่ main thread
                self.postMessage({ success: true, notis });
            } catch (err) {
                self.postMessage({ success: false, error: err.message });
            }
        }, 1000);
    }

    if (e.data.action === "stop") {
        if (interval) clearInterval(interval);
    }
};
