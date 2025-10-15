// ====================================================================================
// CONFIGURAÇÃO CHAVE DO PROJETO (SITE DE PEDIDOS)
// ⚠️ SUBSTITUA OS PLACEHOLDERS PELOS SEUS VALORES REAIS DO GOOGLE FORMS ⚠️
// ====================================================================================
// URL de Ação (JÁ COMPLETO)
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLScnL18rvuEb9bshVPOWLatAY7llz8fCkWnz1APrcwmGcKGjEw/formResponse"; 

// 2. Mapeamento DOS IDS ENCONTRADOS (JÁ COMPLETO)
const FORM_ENTRY_IDS = {
    TIPO_APOIO: 'entry.1944720991', 
    LOCALIZACAO: 'entry.1072432796',
    MOTIVO: 'entry.549038910', 
    TELEFONE: 'entry.111803321', 
    DEFICIENCIA: 'entry.308908157', 
    DETALHES_DEFICIENCIA: 'entry.22088114',
    AUDIO_FLAG: 'entry.512796803' 
};
// ====================================================================================

const step1 = document.getElementById('step1');
const helpForm = document.getElementById('helpForm');
const backToStep1Btn = document.getElementById('back-to-step1');
const optionBtns = document.querySelectorAll('.option-btn');
const tipoApoioInput = document.getElementById('tipoApoio');
const tipoApoioDisplay = document.getElementById('tipoApoioDisplay');
const getLocationBtn = document.getElementById('getLocationBtn');
const localizacaoTextarea = document.getElementById('localizacao');
const deficienciaSim = document.getElementById('deficienciaSim');
const deficienciaNao = document.getElementById('deficienciaNao');
const deficienciaDetalhes = document.getElementById('deficienciaDetalhes');
const outrasDeficiencia = document.getElementById('deficienciaOutras');
const outrasDeficienciaText = document.getElementById('outrasDeficienciaText');
const form = document.getElementById('helpForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const headerLogo = document.getElementById('headerLogo');

const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const deleteButton = document.getElementById('deleteButton');
const audioStatus = document.getElementById('audioStatus');
const audioPlayerContainer = document.querySelector('.audio-player-container');
const audioPlayer = document.getElementById('audioPlayer');

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

// --- FUNÇÕES DE INICIALIZAÇÃO E UTILITÁRIOS (LOGOTIPO) ---

function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const companyLogoUrl = getUrlParameter('logo');
if (companyLogoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = companyLogoUrl; logoImg.alt = "Logo da Empresa"; logoImg.classList.add('header-logo');
    headerLogo.appendChild(logoImg);
} else {
    const logoImg = document.createElement('img');
    logoImg.src = "https://i.ibb.co/C07pT0/logo-helpcode.png"; logoImg.alt = "HelpCode Logo"; logoImg.classList.add('header-logo');
    headerLogo.appendChild(logoImg);
}

// --- EVENT LISTENERS DE NAVEGAÇÃO E LÓGICA (CORRIGIDO) ---

// 1. Avançar para o formulário (Passo 1 -> Formulário)
optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tipoApoioInput.value = btn.dataset.value; tipoApoioDisplay.value = btn.textContent;
        step1.classList.add('hidden'); 
        helpForm.classList.remove('hidden'); 
    });
});

// 2. Voltar ao Passo 1 (Botão <- Voltar)
backToStep1Btn.addEventListener('click', () => {
    helpForm.classList.add('hidden'); 
    step1.classList.remove('hidden'); 
});

// 3. Lógica de Deficiência
deficienciaSim.addEventListener('change', () => deficienciaDetalhes.classList.remove('hidden'));
deficienciaNao.addEventListener('change', () => deficienciaDetalhes.classList.add('hidden'));
outrasDeficiencia.addEventListener('change', () => outrasDeficienciaText.classList.toggle('hidden', !outrasDeficiencia.checked));

// 4. Lógica de Geolocalização
getLocationBtn.addEventListener('click', () => {
    localizacaoTextarea.value = "Obtendo localização...";
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => localizacaoTextarea.value = `Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`);
    } else { localizacaoTextarea.value = "Geolocalização não suportada."; }
});

// --- Lógica de Áudio ---

recordButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream); audioChunks = [];
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.onstop = () => { audioBlob = new Blob(audioChunks); audioStatus.textContent = 'Áudio gravado. Você pode ouvir ou apagar.'; recordButton.disabled = true; stopButton.disabled = true; deleteButton.disabled = false; audioPlayer.src = URL.createObjectURL(audioBlob); audioPlayerContainer.classList.remove('hidden'); stream.getTracks().forEach(track => track.stop()); };
    mediaRecorder.start(); audioStatus.textContent = 'Gravando...'; recordButton.disabled = true; stopButton.disabled = false; deleteButton.disabled = true;
});
stopButton.addEventListener('click', () => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); });
deleteButton.addEventListener('click', () => {
    audioBlob = null; audioStatus.textContent = ''; audioPlayer.src = ''; audioPlayerContainer.classList.add('hidden');
    recordButton.disabled = false; deleteButton.disabled = true; stopButton.disabled = true;
});

// --- Lógica de Submissão para Google Forms ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const googleFormData = new FormData();
    
    // Mapeamento dos dados
    googleFormData.append(FORM_ENTRY_IDS.TIPO_APOIO, tipoApoioInput.value);
    googleFormData.append(FORM_ENTRY_IDS.LOCALIZACAO, localizacaoTextarea.value);
    googleFormData.append(FORM_ENTRY_IDS.MOTIVO, form.motivo.value);
    googleFormData.append(FORM_ENTRY_IDS.TELEFONE, form.telefone.value);
    googleFormData.append(FORM_ENTRY_IDS.DEFICIENCIA, deficienciaSim.checked ? 'Sim' : 'Não');
    
    if (deficienciaSim.checked) {
        let defs = Array.from(document.querySelectorAll('input[name="deficienciaDetalhe"]:checked')).map(cb => cb.value);
        if (document.getElementById('outrasDeficiencia').value) {
            defs.push(`Outras: ${document.getElementById('outrasDeficiencia').value}`);
        }
        googleFormData.append(FORM_ENTRY_IDS.DETALHES_DEFICIENCIA, defs.join(', '));
    } else {
        googleFormData.append(FORM_ENTRY_IDS.DETALHES_DEFICIENCIA, 'Nenhuma');
    }

    // Lógica CHAVE: Envia o sinal de áudio
    if (audioBlob) {
        googleFormData.append(FORM_ENTRY_IDS.AUDIO_FLAG, 'ÁUDIO GRAVADO COM SUCESSO');
    } else {
        googleFormData.append(FORM_ENTRY_IDS.AUDIO_FLAG, 'NÃO GRAVADO');
    }

    try {
        const response = await fetch(GOOGLE_FORM_ACTION_URL, {
            method: 'POST',
            body: googleFormData,
            mode: 'no-cors' 
        });

        confirmationMessage.textContent = 'Seu pedido foi enviado com sucesso!';
        confirmationMessage.className = 'success';
        confirmationMessage.classList.remove('hidden');
        form.reset();
        
        // Dispara o evento para o Painel Gerenciamento atualizar
        window.dispatchEvent(new Event('storage-update')); 

    } catch (error) {
        confirmationMessage.textContent = `Erro: Verifique sua conexão e se a URL do Forms está correta.`;
        confirmationMessage.className = 'error';
        confirmationMessage.classList.remove('hidden');
    }
});