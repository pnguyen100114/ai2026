const AI_ENDPOINT = '/api/ai';
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');

function showView(viewName) {
    views.forEach((view) => view.classList.toggle('active-view', view.id === `${viewName}-view`));
    navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === viewName));
    document.querySelector('.sidebar').classList.remove('open');
}

async function askOpenAI(instructions, input) {
    const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, input })
    });
    if (!response.ok) {
        let detail = '';
        try {
            const errorBody = await response.json();
            detail = errorBody.error?.message || '';
        } catch {
            detail = '';
        }
        throw new Error(detail || `OpenAI API trả về lỗi ${response.status}.`);
    }
    const data = await response.json();
    if (!data.output_text) throw new Error('OpenAI không trả về nội dung.');
    return data.output_text;
}

function addMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    const content = document.createElement('p');
    content.textContent = text;
    const timestamp = document.createElement('span');
    timestamp.textContent = 'Vừa xong';
    const body = document.createElement('div');
    body.append(content, timestamp);
    if (type === 'bot') {
        const icon = document.createElement('div');
        icon.className = 'message-avatar';
        icon.textContent = '✦';
        message.append(icon, body);
    } else {
        message.append(body);
    }
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
}

document.querySelectorAll('[data-view], [data-view-target]').forEach((element) => {
    element.addEventListener('click', () => showView(element.dataset.view || element.dataset.viewTarget));
});

document.querySelector('.mobile-menu').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

document.querySelectorAll('.subject-link').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.subject-link').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        document.querySelector('#chat-subject').value = button.dataset.subject === 'Toán' ? 'Toán học' : button.dataset.subject;
        showView('chat');
    });
});

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const chatSubject = document.querySelector('#chat-subject');
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;
    addMessage(question, 'user');
    chatInput.value = '';
    const loading = addMessage('Đang suy nghĩ...', 'bot');
    try {
        const answer = await askOpenAI(
            'Bạn là StudyMate, trợ lý học tập thân thiện cho học sinh Việt Nam. Giải thích ngắn gọn, chính xác, phù hợp học sinh lớp 12. Không bịa dữ kiện. Nếu là bài tập, hãy trình bày từng bước.',
            `Môn học: ${chatSubject.value}\nCâu hỏi của học sinh: ${question}`
        );
        loading.querySelector('p').textContent = answer;
    } catch (error) {
        loading.querySelector('p').textContent = `Không thể gọi AI: ${error.message}`;
    }
});

document.querySelectorAll('.quick-prompts button, .chat-tips button').forEach((button) => {
    button.addEventListener('click', () => {
        chatInput.value = button.dataset.prompt || button.textContent;
        chatInput.focus();
    });
});

function parseJsonResponse(text) {
    const jsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonText);
}

document.querySelector('#generate-cards').addEventListener('click', async () => {
    const source = document.querySelector('#flashcard-source').value.trim();
    const subject = document.querySelector('#flashcard-subject').value;
    const result = document.querySelector('#flashcard-result');
    if (!source) {
        result.innerHTML = '<div class="generated-message error">Hãy nhập ghi chú trước khi tạo flashcard.</div>';
        return;
    }
    result.innerHTML = '<div class="generated-message loading">✦ AI đang tạo flashcard...</div>';
    try {
        const answer = await askOpenAI(
            'Bạn là công cụ tạo flashcard cho học sinh Việt Nam. Chỉ trả về JSON hợp lệ, không markdown, theo đúng dạng {"cards":[{"question":"...","answer":"..."}]}. Tạo 3 đến 10 thẻ, câu hỏi ngắn, đáp án chính xác.',
            `Môn: ${subject}\nGhi chú học tập:\n${source}`
        );
        const data = parseJsonResponse(answer);
        if (!Array.isArray(data.cards) || data.cards.length === 0) throw new Error('Dữ liệu flashcard không hợp lệ.');
        result.innerHTML = `<div class="generated-message">✓ Đã tạo ${data.cards.length} flashcard ${subject} bằng AI.</div><div class="flashcard-list"></div>`;
        const list = result.querySelector('.flashcard-list');
        data.cards.forEach((card) => {
            const item = document.createElement('div');
            item.className = 'generated-card';
            item.innerHTML = '<strong></strong><span></span>';
            item.querySelector('strong').textContent = card.question;
            item.querySelector('span').textContent = card.answer;
            list.appendChild(item);
        });
    } catch (error) {
        result.innerHTML = `<div class="generated-message error">Không thể tạo flashcard: ${error.message}</div>`;
    }
});

document.querySelector('#new-deck-button').addEventListener('click', () => {
    showView('flashcards');
    document.querySelector('#flashcard-source').focus();
});

document.querySelector('#score-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const scores = {
        'Toán học': Number(data.get('math')),
        'Ngữ văn': Number(data.get('literature')),
        'Tiếng Anh': Number(data.get('english')),
        'Vật lý': Number(data.get('physics'))
    };
    const planContent = document.querySelector('#plan-content');
    planContent.querySelector('.plan-alert').innerHTML = '<strong>✦ AI đang phân tích điểm số...</strong><span>Vui lòng chờ một chút.</span>';
    try {
        const answer = await askOpenAI(
            'Bạn là cố vấn học tập. Chỉ trả về JSON hợp lệ, không markdown, theo dạng {"priority":"...","reason":"...","sessions":[{"time":"...","title":"...","detail":"...","duration":"..."}]}. Tạo đúng 3 buổi học ngắn, thực tế trong tuần.',
            `Điểm số học sinh (thang 10): ${JSON.stringify(scores)}`
        );
        const plan = parseJsonResponse(answer);
        if (!plan.priority || !Array.isArray(plan.sessions)) throw new Error('Kế hoạch trả về không hợp lệ.');
        planContent.querySelector('.plan-alert').innerHTML = `<strong>🎯 Ưu tiên ${plan.priority}</strong><span>${plan.reason}</span>`;
        planContent.querySelectorAll('.schedule-item').forEach((item, index) => {
            const session = plan.sessions[index];
            if (!session) return;
            item.querySelector('span').textContent = session.time;
            item.querySelector('strong').textContent = session.title;
            item.querySelector('small').textContent = session.detail;
            item.querySelector('i').textContent = session.duration;
        });
    } catch (error) {
        planContent.querySelector('.plan-alert').innerHTML = `<strong class="generated-message error">Không thể tạo kế hoạch AI</strong><span>${error.message}</span>`;
    }
});
// ==========================================
// TÍNH NĂNG AI GIÁM SÁT TƯ THẾ & ĐỘ TẬP TRUNG
// ==========================================
const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/L_fgQFAWQ/";

let aiModel = null;
let aiWebcam = null;
let aiCtx = null;
let isAiRunning = false;
let warningTimer = null;

const btnStartStudy = document.getElementById("btn-start-study");
const monitorBox = document.getElementById("ai-monitor-box");
const statusBadge = document.getElementById("ai-status-text");
const canvasElem = document.getElementById("ai-canvas");
const btnCloseMonitor = document.getElementById("close-monitor-btn");

if (canvasElem) {
    aiCtx = canvasElem.getContext("2d");
}

// Bật/tắt giám sát khi bấm nút "Bắt đầu học"
if (btnStartStudy) {
    btnStartStudy.addEventListener("click", async () => {
        if (!isAiRunning) {
            monitorBox.style.display = "block";
            statusBadge.innerText = "Đang nạp AI...";
            await startAiMonitor();
            btnStartStudy.innerText = "Dừng học";
        } else {
            stopAiMonitor();
            btnStartStudy.innerHTML = 'Bắt đầu học <span>→</span>';
        }
    });
}

if (btnCloseMonitor) {
    btnCloseMonitor.addEventListener("click", () => {
        stopAiMonitor();
        if (btnStartStudy) btnStartStudy.innerHTML = 'Bắt đầu học <span>→</span>';
    });
}

async function startAiMonitor() {
    try {
        if (!aiModel) {
            const modelURL = TM_MODEL_URL + "model.json";
            const metadataURL = TM_MODEL_URL + "metadata.json";
            aiModel = await tmPose.load(modelURL, metadataURL);
        }

        const size = 160;
        const flip = true; // Lật gương
        aiWebcam = new tmPose.Webcam(size, size, flip);
        await aiWebcam.setup();
        await aiWebcam.play();

        isAiRunning = true;
        window.requestAnimationFrame(aiLoop);
    } catch (err) {
        console.error("Lỗi khởi tạo AI:", err);
        statusBadge.innerText = "Không thể mở camera";
    }
}

async function aiLoop() {
    if (!isAiRunning) return;
    aiWebcam.update();
    await predictPose();
    window.requestAnimationFrame(aiLoop);
}

async function predictPose() {
    const { pose, posenetOutput } = await aiModel.estimatePose(aiWebcam.canvas);
    const predictions = await aiModel.predict(posenetOutput);

    // Vẽ video và khung xương lên màn hình
    if (aiCtx) {
        aiCtx.drawImage(aiWebcam.canvas, 0, 0);
        if (pose) {
            tmPose.drawKeypoints(pose.keypoints, 0.5, aiCtx);
            tmPose.drawSkeleton(pose.keypoints, 0.5, aiCtx);
        }
    }

    // Lấy nhãn có tỉ lệ chính xác cao nhất
    let top = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
        if (predictions[i].probability > top.probability) {
            top = predictions[i];
        }
    }

    handlePostureResult(top.className, top.probability);
}

// Bộ lọc thời gian 3 giây chống báo nhầm
function handlePostureResult(className, prob) {
    if (prob < 0.75) return;

    if (className === "Tu_the_chuan") {
        clearTimeout(warningTimer);
        warningTimer = null;
        monitorBox.classList.remove("alert");
        statusBadge.className = "status-badge status-good";
        statusBadge.innerText = "Tư thế chuẩn ✓";
        return;
    }

    if (className === "Vang_mat") {
        monitorBox.classList.add("alert");
        statusBadge.className = "status-badge status-warning";
        statusBadge.innerText = "Bạn đã rời vị trí!";
        return;
    }

    // Các trường hợp: Cui_sat, Nghieng_lech, Xao_nhang
    if (!warningTimer) {
        warningTimer = setTimeout(() => {
            monitorBox.classList.add("alert");
            statusBadge.className = "status-badge status-warning";
            
            if (className === "Cui_sat") {
                statusBadge.innerText = "⚠️ Đừng cúi quá sát!";
            } else if (className === "Nghieng_lech") {
                statusBadge.innerText = "⚠️ Hãy ngồi thẳng lưng!";
            } else {
                statusBadge.innerText = "⚠️ Hãy tập trung học!";
            }
        }, 3000); // Giữ sai trên 3 giây mới cảnh báo
    }
}

function stopAiMonitor() {
    isAiRunning = false;
    clearTimeout(warningTimer);
    warningTimer = null;
    if (aiWebcam) {
        aiWebcam.stop();
    }
    if (monitorBox) {
        monitorBox.style.display = "none";
    }
}

// ==========================================
// CỤM XỬ LÝ PHẢN HỒI LỖI VÀ LƯU MẪU CẢI TIẾN
// ==========================================
const btnReportWrong = document.getElementById("btn-report-wrong");
const feedbackSelector = document.getElementById("feedback-selector");
const btnSaveSample = document.getElementById("btn-save-sample");
const correctLabelSelect = document.getElementById("correct-label-select");
const customLabelInput = document.getElementById("custom-label-input");

// Bật/tắt bảng chọn
if (btnReportWrong) {
    btnReportWrong.addEventListener("click", () => {
        feedbackSelector.style.display = feedbackSelector.style.display === "none" ? "flex" : "none";
    });
}

// Ẩn/hiện ô tự nhập nội dung
if (correctLabelSelect) {
    correctLabelSelect.addEventListener("change", (e) => {
        if (e.target.value === "other") {
            customLabelInput.style.display = "block";
            customLabelInput.focus();
        } else {
            customLabelInput.style.display = "none";
        }
    });
}

// Lưu ảnh vào thư mục Downloads
if (btnSaveSample) {
    btnSaveSample.addEventListener("click", () => {
        if (!aiWebcam) return;

        let finalLabel = correctLabelSelect.value;

        if (finalLabel === "other") {
            const userTyped = customLabelInput.value.trim();
            if (!userTyped) {
                alert("Vui lòng nhập mô tả thực tế bạn đang làm gì!");
                return;
            }
            finalLabel = userTyped
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .replace(/[^a-zA-Z0-9]/g, '_');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `edge_case_${finalLabel}_${timestamp}.png`;

        const link = document.createElement("a");
        link.download = filename;
        link.href = aiWebcam.canvas.toDataURL("image/png");
        link.click();

        // Đóng giao diện phản hồi
        feedbackSelector.style.display = "none";
        customLabelInput.value = "";
        customLabelInput.style.display = "none";
        correctLabelSelect.value = "Khong_thang_lung";

        statusBadge.className = "status-badge status-good";
        statusBadge.innerText = "Đã lưu mẫu cải tiến ✓";

        if (typeof triggerAiCheerUp === "function") {
            triggerAiCheerUp(finalLabel);
        }
    });
}