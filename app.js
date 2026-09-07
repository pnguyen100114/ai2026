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
