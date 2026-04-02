const LIMIT = 255;
let archive = JSON.parse(localStorage.getItem('gow_grad_archive') || "[]");
let customPresets = JSON.parse(localStorage.getItem('gow_grad_custom_presets') || "[]");

function hex(c){return Math.round(c).toString(16).padStart(2,'0')}
function lerp(a,b,t){return a+(b-a)*t}

function saveCustomPreset() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    
    if (customPresets.some(p => p.start === start && p.end === end)) {
        showToast("Vorlage existiert bereits!");
        return;
    }

    customPresets.push({ start, end });
    localStorage.setItem('gow_grad_custom_presets', JSON.stringify(customPresets));
    renderCustomPresets();
    showToast("Vorlage gespeichert!");
}

function removeCustomPreset(index, btn) {
    if (!btn.classList.contains('confirm')) {
        btn.textContent = 'Sicher?';
        btn.classList.add('confirm');
        btn.onmouseleave = () => {
            btn.textContent = '×';
            btn.classList.remove('confirm');
        };
        return;
    }
    
    customPresets.splice(index, 1);
    localStorage.setItem('gow_grad_custom_presets', JSON.stringify(customPresets));
    renderCustomPresets();
    showToast("Vorlage gelöscht!");
}

function renderCustomPresets() {
    const container = document.getElementById('customPresetsContainer');
    const list = document.getElementById('customPresetsList');
    
    if (customPresets.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = '';
    
    customPresets.forEach((p, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'preset-wrapper';
        
        const btn = document.createElement('div');
        btn.className = 'preset-btn';
        btn.style.background = `linear-gradient(135deg, ${p.start}, ${p.end})`;
        btn.onclick = () => applyPreset(p.start, p.end);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-preset-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            removeCustomPreset(index, delBtn);
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(delBtn);
        list.appendChild(wrapper);
    });
}

function clearText() {
    document.getElementById('text').value = '';
    saveAndRender();
}

function applyPreset(s, e) {
    document.getElementById('start').value = s;
    document.getElementById('end').value = e;
    saveAndRender();
}

function build(text, mode, start, end){
    if(!text) return {out: "", prev: ""};
    let items = [];
    if(mode === "word") items = text.split(/(\s+)/);
    else if(mode === "2char") {
        let result = [], temp = "";
        for (let char of text) {
            if (/\s/.test(char)) { if (temp) { result.push(temp); temp = ""; } result.push(char); }
            else { temp += char; if (temp.length === 2) { result.push(temp); temp = ""; } }
        }
        if (temp) result.push(temp);
        items = result;
    } else items = [...text];

    const coloredItems = items.filter(u => u && !/^\s+$/.test(u));
    let i = 0, out = "", prev = "";
    items.forEach(u => {
        if(!u) return;
        if(/^\s+$/.test(u)){ out += u; prev += u; return; }
        const t = coloredItems.length > 1 ? i / (coloredItems.length - 1) : 0;
        const r = hex(lerp(start[0], end[0], t)), g = hex(lerp(start[1], end[1], t)), b = hex(lerp(start[2], end[2], t));
        out += `[${r}${g}${b}]${u}`;
        prev += `<span style="color:#${r}${g}${b}">${u}</span>`;
        i++;
    });
    return {out, prev};
}

function saveAndRender() {
    localStorage.setItem('gow_grad_text', document.getElementById('text').value);
    localStorage.setItem('gow_grad_start', document.getElementById('start').value);
    localStorage.setItem('gow_grad_end', document.getElementById('end').value);
    localStorage.setItem('gow_grad_mode', document.getElementById('mode').value);
    render();
}

function render(){
    const text = document.getElementById('text').value, startHex = document.getElementById('start').value, endHex = document.getElementById('end').value;
    const parseColor = (hexStr) => (hexStr.match(/[0-9a-f]{2}/gi) || ["00","00","00"]).map(x => parseInt(x, 16));
    const start = parseColor(startHex), end = parseColor(endHex), mode = document.getElementById('mode').value;
    let result = build(text, mode, start, end);
    document.getElementById('output').value = result.out;
    document.getElementById('preview').innerHTML = result.prev;
    const c = result.out.length;
    const counter = document.getElementById('count');
    counter.textContent = `Zeichen: ${c} / ${LIMIT}`;
    counter.className = "counter " + (c > LIMIT ? "bad" : "ok");
}

function copyToClipboard() {
    const text = document.getElementById('output').value;
    if(!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        const oldText = btn.textContent;
        btn.textContent = "KOPIERT! ✓";
        btn.style.background = "#28a745";
        setTimeout(() => { btn.textContent = oldText; btn.style.background = "#444"; }, 2000);
    });
}

function saveToArchive() {
    const textInput = document.getElementById('text').value;
    const startColor = document.getElementById('start').value;
    const endColor = document.getElementById('end').value;
    const modeSelect = document.getElementById('mode').value;
    const outputCode = document.getElementById('output').value;
    const previewHtml = document.getElementById('preview').innerHTML;

    if(!outputCode) return;
    if (archive.some(item => item.out === outputCode)) return;

    const newItem = {
        out: outputCode,
        prev: previewHtml,
        rawText: textInput,
        start: startColor,
        end: endColor,
        mode: modeSelect
    };

    archive.unshift(newItem);
    localStorage.setItem('gow_grad_archive', JSON.stringify(archive));
    renderArchive();
    
    const btn = document.getElementById('saveBtn');
    btn.textContent = "GESPEICHERT!";
    setTimeout(() => { btn.textContent = "ARCHIVIEREN"; }, 2000);
}

function removeFromArchive(index) {
    archive.splice(index, 1);
    localStorage.setItem('gow_grad_archive', JSON.stringify(archive));
    renderArchive();
}

function loadFromArchive(index) {
    const item = archive[index];
    if (!item || !item.rawText) return;

    document.getElementById('text').value = item.rawText;
    document.getElementById('start').value = item.start;
    document.getElementById('end').value = item.end;
    document.getElementById('mode').value = item.mode;
    
    saveAndRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderArchive() {
    const container = document.getElementById('archiveContainer');
    const list = document.getElementById('archiveList');
    if (archive.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    list.innerHTML = '';
    archive.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-preview">${item.prev}</div>
            <div class="item-actions">
                <button class="action-btn copy-item">Kopieren</button>
                ${item.rawText !== undefined ? `<button class="action-btn load-btn load-item">Laden</button>` : ''}
                <button class="action-btn delete-btn remove-item">Löschen</button>
            </div>
        `;
        div.querySelector('.copy-item').onclick = () => {
            navigator.clipboard.writeText(item.out);
            const btn = div.querySelector('.copy-item');
            btn.textContent = 'KOPIERT!';
            btn.style.background = '#28a745'; btn.style.color = '#fff';
            setTimeout(() => { btn.textContent = 'Kopieren'; btn.style.background = '#333'; btn.style.color = '#66ff99'; }, 1500);
        };
        const loadBtn = div.querySelector('.load-item');
        if (loadBtn) loadBtn.onclick = () => loadFromArchive(index);
        div.querySelector('.remove-item').onclick = () => removeFromArchive(index);
        list.appendChild(div);
    });
}

function loadSettings() {
    const sText = localStorage.getItem('gow_grad_text'), sStart = localStorage.getItem('gow_grad_start'), sEnd = localStorage.getItem('gow_grad_end'), sMode = localStorage.getItem('gow_grad_mode');
    if (sText !== null) document.getElementById('text').value = sText;
    if (sStart !== null) document.getElementById('start').value = sStart;
    if (sEnd !== null) document.getElementById('end').value = sEnd;
    if (sMode !== null) document.getElementById('mode').value = sMode;
    render();
    renderArchive();
    renderCustomPresets();
}

function openExportModal() {
    const data = {
        text: localStorage.getItem('gow_grad_text'),
        start: localStorage.getItem('gow_grad_start'),
        end: localStorage.getItem('gow_grad_end'),
        mode: localStorage.getItem('gow_grad_mode'),
        archive: archive,
        customPresets: customPresets
    };
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    document.getElementById('exportText').value = base64;
    document.getElementById('exportModal').classList.add('show');
}

function copyExportCode() {
    const textArea = document.getElementById('exportText');
    
    textArea.select();
    textArea.setSelectionRange(0, 99999);

    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textArea.value).then(() => {
                showToast("Code in Zwischenablage kopiert!");
                closeModal('exportModal');
            });
        } else {
            document.execCommand('copy');
            showToast("Code in Zwischenablage kopiert!");
            closeModal('exportModal');
        }
    } catch (err) {
        document.execCommand('copy');
        showToast("Code in Zwischenablage kopiert!");
        closeModal('exportModal');
    }
}

function openImportModal() {
    const input = document.getElementById('importInput');
    input.value = '';
    document.getElementById('importModal').classList.add('show');
    // Kurze Verzögerung für den Fokus, damit das Element sicher sichtbar ist
    setTimeout(() => input.focus(), 10);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function importFromInput() {
    const text = document.getElementById('importInput').value.trim();
    if (!text) return;
    try {
        const jsonStr = decodeURIComponent(escape(atob(text)));
        const data = JSON.parse(jsonStr);
        
        if (data.text !== undefined) localStorage.setItem('gow_grad_text', data.text);
        if (data.start !== undefined) localStorage.setItem('gow_grad_start', data.start);
        if (data.end !== undefined) localStorage.setItem('gow_grad_end', data.end);
        if (data.mode !== undefined) localStorage.setItem('gow_grad_mode', data.mode);
        if (data.archive !== undefined) {
            localStorage.setItem('gow_grad_archive', JSON.stringify(data.archive));
            archive = data.archive;
        }
        if (data.customPresets !== undefined) {
            localStorage.setItem('gow_grad_custom_presets', JSON.stringify(data.customPresets));
            customPresets = data.customPresets;
        }
        
        loadSettings();
        showToast("Daten erfolgreich importiert!");
        closeModal('importModal');
    } catch (err) {
        showToast("Fehler: Ungültiger Import-Code!", true);
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

loadSettings();
