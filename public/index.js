async function loadRooms() {
    const res = await fetch("/api/rooms");
    const rooms = await res.json();
    const list = document.getElementById("roomsList");
    list.innerHTML = "";
    if (!rooms.length) {
        list.innerHTML = "<p>No active rooms</p>";
        return;
    }
    rooms.forEach((r) => {
        const div = document.createElement("div");
        div.style.padding = "0.5rem";
        div.style.border = "1px solid #ccc";
        div.style.marginBottom = "0.5rem";
        div.innerHTML = `<strong>${r.roomId}</strong> — ${r.participants} participants <button data-room="${r.roomId}">Join</button>`;
        const btn = div.querySelector("button");
        btn.addEventListener("click", () => {
            location.href = `/${r.roomId}`;
        });
        list.appendChild(div);
    });
}

document.getElementById("createRoom").addEventListener("click", () => {
    location.href = "/new";
});

loadRooms();
setInterval(loadRooms, 5000);
