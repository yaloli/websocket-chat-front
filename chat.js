const chatBox = document.getElementById("chat");
const serverUrl = "localhost:8083"
const socket = new WebSocket(`ws://${serverUrl}/ws/chat`);
const confluenceId = document.querySelector('meta[name="ajs-current-user-fullname"]').content; 
// const confluenceId = 100;
const inputArea = document.getElementById("msg");
const chatTitle = document.getElementById("chat-header");
const chatRoomId = document.querySelector('meta[name="ajs-page-id"]').content;
const tooltip = document.getElementById("memberTooltip")

var lastMessageTimestamp = null
// 사진 첨부기능 추가
// 답글기능 추가


socket.onopen = () => {
    socket.send(JSON.stringify({
        messageType: "ENTER",
        chatRoomId: chatRoomId,
        senderId: confluenceId,
        message: "입장했습니다"
    }))
    print_date(new Date());
}

socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.messageType==='EXIT') {
        console.log('퇴장')
        console.log(msg)
        setMembers(msg.members)
        return;
    }

    const chatRoomDiv = document.createElement("div");
    chatRoomDiv.innerText = `[${get_today()}] ${msg.senderId}: ${msg.message}`;
    
    if (msg.messageType==='ENTER') {
        chatRoomDiv.style="color: lightgray";
        console.log('입장')
        console.log(msg);
        setMembers(msg.members)
    }

    if (msg.messageType ==='IMAGE') {
        chatRoomDiv.innerText = `[${get_today()}] ${msg.senderId}: `;
        const img = document.createElement('img');
        
        img.src = msg.message;
        img.style.maxWidth = '100%';
        img.style.display = "block"
        chatRoomDiv.style.maxWidth="600px"
        chatRoomDiv.appendChild(img);
    }

    chatBox.appendChild(chatRoomDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
    if (!document.hasFocus()) {
        t = window.open('신규 메세지 확인');
        t.close();
    }
};

function send() {
    const text = document.getElementById("msg").value;
    socket.send(
        JSON.stringify({
        messageType: "TALK",
        chatRoomId: chatRoomId,
        senderId: confluenceId,
        message: text           
        })
    );
    text.value = "";

    document.getElementById("msg").value = "";
}

function setMembers(members) {
    updateChatTitleWithMember(members)
    tooltip.innerHTML = members.map(name => `<div>${name}</div>`).join("");
}

function get_today() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth()+1).padStart(2,'0');
    const day = String(today.getDate()).padStart(2,'0');
    const hours = String(today.getHours()).padStart(2,'0');
    const minutes = String(today.getMinutes()).padStart(2,'0');
    const seconds = String(today.getSeconds()).padStart(2,'0');

    if (day!= String(lastMessageTimestamp?.getDate()).padStart(2,'0')) {
        print_date(today)
    }

    return `${hours}:${minutes}:${seconds}`;
}

function print_date(today) {
    lastMessageTimestamp = today;
    const year = today.getFullYear();
    const month = String(today.getMonth()+1).padStart(2,'0');
    const day = String(today.getDate()).padStart(2,'0');
    
    const chatRoomDiv = document.createElement("div");
    chatRoomDiv.style="margin: 10px auto;text-align: center"
    chatRoomDiv.innerText = `${year}-${month}-${day}`;
    chatBox.appendChild(chatRoomDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updateChatTitleWithMember(members) {
    chatTitle.innerText = "채팅("+members.length+")"

}

async function uploadImageAndSend(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`http://${serverUrl}/upload`, {
        method: "POST",
        body: formData
    })

    const data = await res.json();
    const imageUri = data.uri;

    socket.send(JSON.stringify({
        messageType: "IMAGE",
        chatRoomId: chatRoomId,
        senderId: confluenceId,
        message: `http://${serverUrl}/${imageUri}`           
    }))
}

function init() {

}

inputArea.addEventListener("keydown", function(event) {
    if(event.key == "Enter") {
        send();
    }
});

chatTitle.addEventListener("mouseover", (e)=> {
    tooltip.style.top = chatTitle.offsetHeight+"px";
    tooltip.style.left = "0px";
    tooltip.style.display = "block"
})

chatTitle.addEventListener("mouseout", (e)=> {
    tooltip.style.display = "none"
})

chatBox.addEventListener("dragover", (e)=> {
    e.preventDefault();
    chatBox.style.backgroundColor = "#f0f0f0";
});

chatBox.addEventListener("dragleave", ()=> {
    chatBox.style.backgroundColor = "";
})

chatBox.addEventListener("drop", (e)=> {
    e.preventDefault();
    chatBox.style.backgroundColor = "";

    const files = e.dataTransfer.files;
    if(files.length > 0) {
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                uploadImageAndSend(file);
            }
        }
    }
});

inputArea.addEventListener("paste", (e)=> {
    const items = e.clipboardData.items;

    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            uploadImageAndSend(file);
        }
    }

});

init()
