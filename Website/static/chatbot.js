class Chatbot {
    constructor() {
        this.initialize();
        this.messageHistory = [];
        this.isTyping = false;
    }

    initialize() {
        // Create chatbot HTML structure
        const chatbotHTML = `
            <div class="chatbot-container">
                <div class="chat-bubble" id="chatBubble">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="chat-window" id="chatWindow">
                    <div class="chat-header">
                        <h3><i class="fas fa-robot mr-2"></i> AI Healthcare Assistant</h3>
                        <span class="close-chat" id="closeChat">×</span>
                    </div>
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-input">
                        <input type="text" placeholder="Type your message..." id="userInput">
                        <button id="sendMessage">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        this.attachEventListeners();
        this.sendWelcomeMessage();
    }

    attachEventListeners() {
        const chatBubble = document.getElementById('chatBubble');
        const chatWindow = document.getElementById('chatWindow');
        const closeChat = document.getElementById('closeChat');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendMessage');

        chatBubble.addEventListener('click', () => this.toggleChat());
        closeChat.addEventListener('click', () => this.toggleChat());
        
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && userInput.value.trim()) {
                this.handleUserInput();
            }
        });

        sendButton.addEventListener('click', () => {
            if (userInput.value.trim()) {
                this.handleUserInput();
            }
        });

        userInput.addEventListener('input', () => {
            sendButton.disabled = !userInput.value.trim();
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            document.getElementById('userInput').focus();
        }
    }

    async handleUserInput() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        userInput.value = '';
        userInput.disabled = true;

        this.addMessage(message, 'user');
        this.messageHistory.push({ role: 'user', content: message });

        this.showTypingIndicator();
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            
            this.addMessage(response.response, 'bot');
            this.messageHistory.push({ role: 'bot', content: response.response });

            // Add quick replies if available
            if (response.quick_replies && response.quick_replies.length > 0) {
                this.addQuickReplies(response.quick_replies);
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage("I apologize, but I'm having trouble connecting to my AI. Please try again.", 'bot');
        }

        userInput.disabled = false;
        userInput.focus();
    }

    async getAIResponse(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: this.messageHistory
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    }

    addMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Convert URLs to clickable links
        const linkedMessage = message.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        messageDiv.innerHTML = linkedMessage;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    addQuickReplies(replies) {
        const quickRepliesDiv = document.createElement('div');
        quickRepliesDiv.className = 'quick-replies';
        
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply';
            button.textContent = reply;
            button.addEventListener('click', () => {
                document.getElementById('userInput').value = reply;
                this.handleUserInput();
            });
            quickRepliesDiv.appendChild(button);
        });

        document.getElementById('chatMessages').appendChild(quickRepliesDiv);
    }

    sendWelcomeMessage() {
        setTimeout(() => {
            this.addMessage("Hello! I'm your AI-powered healthcare assistant. I can help you with skin condition information, finding dermatologists, and understanding your symptoms. How can I assist you today?", 'bot');
            this.addQuickReplies([
                "Tell me about skin conditions",
                "Find a dermatologist",
                "Check my symptoms",
                "Skincare advice"
            ]);
        }, 500);
    }
}

// Initialize chatbot when the page loads
window.addEventListener('load', () => {
    new Chatbot();
}); 