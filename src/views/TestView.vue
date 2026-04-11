<script setup>
import { nextTick, ref } from 'vue';
import Title from '@/components/common/Title.vue';

const chatBox = ref(null);
const inputText = ref('');
const isSending = ref(false);

// 1. Variabile reattiva ESCLUSIVA per il testo in streaming
const streamingText = ref(''); 

const messages = ref([
    {
        role: 'ai',
        text: 'Ciao!'
    }
]);

async function scrollToBottom() {
    await nextTick();
    if (!chatBox.value) return;
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
}

async function inviaMessaggio() {
    const userInput = inputText.value.trim();
    if (!userInput || isSending.value) return;

    // Aggiungi subito il messaggio dell'utente
    messages.value.push({ role: 'user', text: userInput });
    inputText.value = '';
    
    // Inizia la fase di invio e resetta il buffer dello streaming
    isSending.value = true;
    streamingText.value = ''; 
    await scrollToBottom();

    try {
        const response = await fetch('https://api.lkev.in/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userInput })
        });

        if (!response.ok || !response.body) throw new Error('Errore di rete');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const contentType = response.headers.get('content-type') || '';
        const isSseResponse = contentType.includes('text/event-stream');

        const appendDelta = (chunk) => {
            if (!chunk || chunk === '[DONE]') return;
            // 2. Aggiorniamo una stringa ref diretta (Vue non può ignorarlo)
            streamingText.value += chunk; 
        };

        const processEvent = (eventBlock) => {
            const dataLines = eventBlock
            .split(/\r?\n/)
                .filter((line) => line.startsWith('data: '))
                .map((line) => line.slice(6));

            for (const dataLine of dataLines) {
                if (dataLine === '[DONE]') continue;
                try {
                    appendDelta(JSON.parse(dataLine));
                } catch {
                    appendDelta(dataLine);
                }
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, { stream: true });

            if (!isSseResponse) {
                appendDelta(chunkText);
                await scrollToBottom();
                continue;
            }

            buffer += chunkText;

            while (true) {
                const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
                const eventSeparatorIndex = normalizedBuffer.indexOf('\n\n');
                if (eventSeparatorIndex === -1) break;

                const eventBlock = normalizedBuffer.slice(0, eventSeparatorIndex).trim();
                buffer = normalizedBuffer.slice(eventSeparatorIndex + 2);

                if (eventBlock) processEvent(eventBlock);
            }
            await scrollToBottom();
        }

        if (isSseResponse) {
            const remaining = buffer.trim();
            if (remaining) processEvent(remaining);
        }

        // 3. A streaming finito, sposta il testo completato nei messaggi veri
        messages.value.push({ role: 'ai', text: streamingText.value });

    } catch (error) {
        console.error('Errore:', error);
        messages.value.push({ role: 'ai', text: "Ops, c'è stato un problema." });
    } finally {
        isSending.value = false;
        streamingText.value = ''; // Svuota il buffer per il prossimo giro
        await scrollToBottom();
    }
}
</script>

<template>
    <section class="section test-chat-view">
        <Title title="Test Chat" class="title-container"/>

        <div ref="chatBox" class="chat-box content" id="chat-box">
            <div
                v-for="(msg, index) in messages"
                :key="`${msg.role}-${index}`"
                class="msg"
                :class="msg.role"
            >
                {{ msg.text }}
            </div>
            
            <div v-if="isSending" class="msg ai">
                {{ streamingText }}
                <span v-if="streamingText.length > 0" class="blinking-cursor">|</span>
            </div>
        </div>

        <form class="chat-form" @submit.prevent="inviaMessaggio">
            <input
                id="tuo-input-testo"
                v-model="inputText"
                type="text"
                placeholder="Scrivi qui..."
                :disabled="isSending"
                autocomplete="off"
            >
            <button class="btn filled" type="submit" :disabled="isSending || !inputText.trim()">
                {{ isSending ? 'Invio...' : 'Invia' }}
            </button>
        </form>
    </section>
</template>

<style scoped>
.title-container{
    background: linear-gradient(135deg, var(--primary), var(--surface));
}
.section{
    margin: 30px 0;
}
.content{
    margin-top: 20px;
}
.test-chat-view {
    width: min(860px, 100%);
    color: var(--on-surface);
}

.test-chat-view h1 {
    font-size: clamp(1.2rem, 4vw, 1.8rem);
    margin: 0 0 0.8rem;
}

.chat-box {
    border: 1px solid var(--divider);
    border-radius: 25px;
    min-height: 300px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 1rem;
    background: var(--surface-variant);
}

.msg {
    width: fit-content;
    max-width: 85%;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    border-radius: 25px;
    white-space: pre-wrap;
    line-height: 1.45;
    overflow-wrap: anywhere;
}
.msg.user { margin-left: auto; background: var(--primary); color: var(--on-primary); }
.msg.ai { background: var(--surface); color: var(--on-surface); }
.chat-form { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; margin-top: 20px; }
.chat-form input {
    flex: 1;
    min-width: 0;
    padding: 0.7rem 0.8rem;
    border: 1px solid var(--divider);
    border-radius: 25px;
    color: var(--on-surface);
    background: var(--surface-variant);
    font-size: 16px;
    min-height: 44px;
}
.chat-form input:focus {
    outline: 1px solid var(--on-surface-primary);
}
.chat-form .send-btn {
    border-radius: 25px;
    padding: 0.7rem 1rem;
    min-height: 44px;
    white-space: nowrap;
}
.chat-form .send-btn:hover {
    background-color: var(--primary-hover);
}
.chat-form button:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {

    .chat-box {
        min-height: 52vh;
        max-height: 62vh;
        padding: 0.75rem;
    }

    .msg {
        max-width: 92%;
        font-size: 0.95rem;
        padding: 0.55rem 0.75rem;
    }

    .chat-form {
        gap: 0.45rem;
    }
}

@media (max-width: 560px) {

    .chat-box {
        min-height: 50vh;
        max-height: 58vh;
        border-radius: 25px;
    }

    .chat-form {
        flex-direction: column;
    }

    .chat-form button {
        width: 100%;
    }
}

/* Bonus per te: Cursore lampeggiante in stile terminale per lo stream */
.blinking-cursor {
    font-weight: bold;
    animation: blink 1s step-end infinite;
    color: var(--on-surface-primary);
    margin-left: 2px;
}
@keyframes blink {
    50% { opacity: 0; }
}
</style>