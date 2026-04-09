document.addEventListener('DOMContentLoaded', () => {
    
    // Auto-resizing textareas to feel like writing on paper
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => {
        ta.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    let editingEntryId = null;
    const newEntryBtn = document.getElementById('newEntryBtn');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const formContainer = document.getElementById('diaryFormContainer');
    const diaryForm = document.getElementById('diaryForm');
    const exportBtn = document.getElementById('exportBtn');
    const canvasHeaderTitle = document.querySelector('.canvas-header h2');
    const formSubmitBtn = document.querySelector('.btn-save');
    
    // Set Header Date
    const headerDate = document.getElementById('currentDateDisplay');
    const today = new Date();
    headerDate.textContent = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    function getLocalISOTime() {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return (new Date(now - tzOffset)).toISOString().slice(0, 16);
    }

    // Init Date input
    document.getElementById('datetime').value = getLocalISOTime();

    // Load Entries
    renderEntries();

    // Event Listeners
    newEntryBtn.addEventListener('click', () => {
        editingEntryId = null;
        canvasHeaderTitle.textContent = '新しいページ';
        formSubmitBtn.textContent = 'このページを綴じる（保存）';
        diaryForm.reset();
        document.getElementById('datetime').value = getLocalISOTime();

        formContainer.style.display = 'block';
        newEntryBtn.style.display = 'none';
        
        // Scroll to form smoothly
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    });

    closeFormBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        newEntryBtn.style.display = 'flex';
    });

    diaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEntry();
    });

    exportBtn.addEventListener('click', exportAll);

    function saveEntry() {
        const entries = getEntries();
        const datetimeVal = document.getElementById('datetime').value;

        const entryData = {
            datetime: datetimeVal,
            goal: document.getElementById('goal').value,
            method: document.getElementById('method').value,
            result: document.getElementById('result').value,
            fileLocation: document.getElementById('fileLocation').value,
            consideration: document.getElementById('consideration').value,
            insights: document.getElementById('insights').value,
            blockers: document.getElementById('blockers').value,
            nextStep: document.getElementById('nextStep').value,
            todo: document.getElementById('todo').value,
            smallWins: document.getElementById('smallWins').value
        };

        if (editingEntryId) {
            const index = entries.findIndex(e => e.id == editingEntryId);
            if (index !== -1) {
                entryData.id = editingEntryId;
                entryData.lastEdited = Date.now();
                entries[index] = Object.assign({}, entries[index], entryData);
            }
        } else {
            entryData.id = Date.now();
            entries.unshift(entryData);
        }

        localStorage.setItem('researchDiaries_v2', JSON.stringify(entries));

        // Close form & reset
        diaryForm.reset();
        document.getElementById('datetime').value = getLocalISOTime();
        formContainer.style.display = 'none';
        newEntryBtn.style.display = 'flex';
        editingEntryId = null;
        
        // Render
        renderEntries();
    }

    function getEntries() {
        // use a new key to avoid migration issues from previous
        let data = localStorage.getItem('researchDiaries_v2');
        if(!data) {
            // fallback to older version if exists
            data = localStorage.getItem('researchDiaries');
        }
        return data ? JSON.parse(data) : [];
    }

    function renderEntries() {
        const list = document.getElementById('entriesList');
        const entries = getEntries();

        if (entries.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 3rem 0; animation: fadeIn 1s; font-family: var(--font-sans);">
                    <p>まだ記録がありません。今日の成果を綴りましょう。</p>
                </div>`;
            return;
        }

        list.innerHTML = '';
        entries.forEach((entry, index) => {
            const dt = new Date(entry.datetime);
            const dateStr = dt.toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' }) + ' ' + dt.toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'});

            const page = document.createElement('article');
            page.className = 'diary-page';
            page.style.animationDelay = `${index * 0.1}s`;

            // Helper to render fields only if they have content
            const renderField = (label, value) => {
                if(!value || value.trim() === '') return '';
                return `
                <div class="read-section">
                    <span class="read-label">${label}</span>
                    <div class="read-value">${escapeHTML(value)}</div>
                </div>`;
            };

            let lastEditedHtml = '';
            if (entry.lastEdited) {
                const editDt = new Date(entry.lastEdited);
                const editStr = editDt.toLocaleDateString('ja-JP', { year:'numeric', month:'short', day:'numeric' }) + ' ' + editDt.toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'});
                lastEditedHtml = `<span class="edited-date">(編集済み: ${editStr})</span>`;
            }

            page.innerHTML = `
                <span class="page-date">${dateStr}${lastEditedHtml}</span>
                <h3 class="page-title">${escapeHTML(entry.goal)}</h3>
                
                <div class="page-content">
                    ${renderField('やったこと / 作業内容・手法', entry.method)}
                    ${renderField('やったこと / 結果・データ', entry.result)}
                    ${renderField('今日扱ったファイル・場所', entry.fileLocation)}
                    
                    ${renderField('思考 / 考察', entry.consideration)}
                    ${renderField('思考 / 違和感・気づき', entry.insights)}
                    ${renderField('思考 / 詰まっている点', entry.blockers)}
                    
                    ${renderField('未来 / Next Step', entry.nextStep)}
                    ${renderField('未来 / Todo', entry.todo)}
                    
                    ${renderField('メンタル / Small Wins', entry.smallWins)}
                </div>
                <div class="page-actions">
                    <button class="btn-edit-single" data-id="${entry.id}">編集</button>
                    <button class="btn-download-single" data-id="${entry.id}">MD出力</button>
                    <button class="btn-delete-single" data-id="${entry.id}">削除</button>
                </div>
            `;

            list.appendChild(page);
        });

        // Add event listeners for single exports
        document.querySelectorAll('.btn-download-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const entry = entries.find(en => en.id == id);
                if(entry) {
                    downloadMarkdown(generateMarkdown(entry), `diary_${id}.md`);
                }
            });
        });

        // Add event listeners for edit
        document.querySelectorAll('.btn-edit-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const entry = entries.find(en => en.id == id);
                if(entry) {
                    editingEntryId = id;
                    canvasHeaderTitle.textContent = '記録を編集する';
                    formSubmitBtn.textContent = '編集内容を保存（更新）';
                    
                    document.getElementById('datetime').value = entry.datetime || '';
                    document.getElementById('goal').value = entry.goal || '';
                    document.getElementById('method').value = entry.method || '';
                    document.getElementById('result').value = entry.result || '';
                    document.getElementById('fileLocation').value = entry.fileLocation || '';
                    document.getElementById('consideration').value = entry.consideration || '';
                    document.getElementById('insights').value = entry.insights || '';
                    document.getElementById('blockers').value = entry.blockers || '';
                    document.getElementById('nextStep').value = entry.nextStep || '';
                    document.getElementById('todo').value = entry.todo || '';
                    document.getElementById('smallWins').value = entry.smallWins || '';

                    formContainer.style.display = 'block';
                    newEntryBtn.style.display = 'none';

                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 50);
                }
            });
        });

        // Add event listeners for single deletes
        document.querySelectorAll('.btn-delete-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm("この記録を本当に削除しますか？ (Are you sure you want to delete this entry?)")) {
                    deleteEntry(id);
                }
            });
        });
    }

    function deleteEntry(id) {
        let entries = getEntries();
        entries = entries.filter(en => en.id != id);
        localStorage.setItem('researchDiaries_v2', JSON.stringify(entries));
        renderEntries();
    }

    function escapeHTML(str) {
        if(!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function generateMarkdown(entry) {
        return `# 研究日記: ${new Date(entry.datetime).toLocaleString('ja-JP')}

## 「やったこと」の記録
- **メインの活動**: ${entry.goal}
- **実施した作業内容・手法**: ${entry.method}
- **結果・データ**: ${entry.result}
- **ファイルの場所**: ${entry.fileLocation}

## 「思考」の記録
- **考察**: ${entry.consideration || '-'}
- **違和感と気づき**: ${entry.insights || '-'}
- **詰まっているポイント**: ${entry.blockers || '-'}

## 「未来」への申し送り
- **Next Step**: ${entry.nextStep || '-'}
- **Todoリスト**: \n${entry.todo ? entry.todo.split('\n').map(t => '- ' + t).join('\n') : '-'}

## 「メンタル」の記録
- **Small Wins**: ${entry.smallWins || '-'}
`;
    }

    function exportAll() {
        const entries = getEntries();
        if (entries.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }
        let md = '# Research Diary Archive\n\n';
        entries.forEach(e => md += generateMarkdown(e) + '\n---\n\n');
        downloadMarkdown(md, 'research_diary_all.md');
    }

    function downloadMarkdown(text, filename) {
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
