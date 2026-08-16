(function() {
    // 1. Wstrzykujemy style CSS do strony klienta
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --primary-color: #374151;
            --primary-hover: #1f2937;
            --bg-color: #f8fafc;
            --chat-bg: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow-drop: 0 10px 25px -5px rgba(55, 65, 81, 0.2);
            --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .fati-chat-toggle-btn {
            position: fixed; bottom: 20px; right: 20px; width: 78px; height: 78px;
            background-color: var(--primary-color); color: white; border: none; border-radius: 50%;
            cursor: pointer; box-shadow: var(--shadow-drop); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 1000; transition: transform 0.3s;
        }
        .fati-chat-toggle-btn:hover { background-color: var(--primary-hover); transform: scale(1.08); }
        .fati-chat-container {
            position: fixed; bottom: 110px; right: 20px; width: 320px; height: 440px;
            background-color: var(--chat-bg); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            display: none; flex-direction: column; overflow: hidden; z-index: 999; font-family: var(--font-family);
        }
        .fati-chat-container.open { display: flex; }
        .fati-chat-header { background: #374151; color: white; padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
        .fati-chat-messages { flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; font-size: 13px; }
        .fati-message { max-width: 85%; padding: 10px 14px; border-radius: 12px; line-height: 1.4; }
        .fati-message.bot { background: white; color: var(--text-main); border: 1px solid var(--border-color); align-self: flex-start; }
        .fati-message.user { background: #374151; color: white; align-self: flex-end; }
        .fati-chat-input-area { padding: 10px; background: white; border-top: 1px solid var(--border-color); display: flex; gap: 8px; }
        .fati-chat-input-area input { flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; outline: none; font-size: 13px; }
        .fati-send-btn { background: #374151; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
    `;
    document.head.appendChild(style);

    // 2. Wstrzykujemy strukturę HTML czatu do strony klienta
    const chatHTML = `
        <div class="fati-chat-container" id="fatiChatContainer">
            <div class="fati-chat-header">
                <div style="font-weight: bold; font-size: 14px;">fati AI Asystent</div>
            </div>
            <div class="fati-chat-messages" id="fatiMessages">
                <div class="fati-message bot">✨ Cześć! Analizuję tę stronę, aby pomóc Twoim klientom...</div>
            </div>
            <div class="fati-chat-input-area">
                <input type="text" id="fatiUserInput" placeholder="Napisz wiadomość..." onkeypress="if(event.key==='Enter') fatiSendMessage()">
                <button class="fati-send-btn" onclick="fatiSendMessage()">Wyślij</button>
            </div>
        </div>
        <button class="fati-chat-toggle-btn" onclick="fatiToggleChat()">
            <span style="font-size: 11px; font-weight: bold;">fati AI</span>
        </button>
    `;
    const container = document.createElement('div');
    container.innerHTML = chatHTML;
    document.body.appendChild(container);

    let companyContext = "";
    const backendUrl = "http://64.176.69.196:8000";

    // 3. AUTOMATYCZNE pobieranie strony w tle zaraz po załadowaniu skryptu
    async function fatiInitContext() {
        const currentWebsiteUrl = window.location.href; // Pobiera adres strony klienta automatycznie!
        try {
            const response = await fetch(`${backendUrl}/analyze-website`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentWebsiteUrl })
            });
            const data = await response.json();
            if (response.ok) {
                companyContext = data.company_context;
                const msgBox = document.getElementById('fatiMessages');
                msgBox.innerHTML += `<div class="fati-message bot">Gotowy do działania! W czym mogę pomóc?</div>`;
            }
        } catch (e) {
            console.error("Błąd automatycznej analizy strony przez fati AI", e);
        }
    }

    fatiInitContext();

    // 4. Obsługa otwierania i wysyłania wiadomości
    window.fatiToggleChat = function() {
        const box = document.getElementById('fatiChatContainer');
        box.classList.toggle('open');
    };

    window.fatiSendMessage = async function() {
        const input = document.getElementById('fatiUserInput');
        const text = input.value.trim();
        if (!text) return;

        const msgBox = document.getElementById('fatiMessages');
        msgBox.innerHTML += `<div class="fati-message user">${text}</div>`;
        input.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;

        try {
            const response = await fetch(`${backendUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_context: companyContext, question: text })
            });
            const data = await response.json();
            if (response.ok) {
                msgBox.innerHTML += `<div class="fati-message bot">${data.reply}</div>`;
            } else {
                msgBox.innerHTML += `<div class="fati-message bot">Wystąpił błąd odpowiedzi.</div>`;
            }
        } catch (e) {
            msgBox.innerHTML += `<div class="fati-message bot">Błąd połączenia z serwerem.</div>`;
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    };
})();