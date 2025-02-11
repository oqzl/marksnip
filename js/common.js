// 各要素の取得
const markdownInput = document.getElementById('markdownInput');
const previewContent = document.getElementById('previewContent');
const previewContainer = document.querySelector('.preview');
const downloadBtn = document.getElementById('downloadBtn');
const dataUrlBtn = document.getElementById('dataUrlBtn');
const toggleEditorBtn = document.getElementById('toggleEditorBtn');
const themeSelect = document.getElementById('themeSelect');
const container = document.querySelector('.container');
const charCount = document.getElementById('charCount');

// ヘルパー関数：現在の内容から Data‑URL を生成する
function generateDataUrl() {
    const compressedMarkdown = LZString.compressToEncodedURIComponent(markdownInput.value);
    let basePath = location.pathname;
    return location.origin + basePath +
        '?t=' + encodeURIComponent(themeSelect.value) +
        '#d=' + compressedMarkdown;
}

// テーマ更新：preview 要素のクラスを更新
function updateTheme() {
    previewContainer.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
            previewContainer.classList.remove(cls);
        }
    });
    previewContainer.classList.add('theme-' + themeSelect.value);
}

// Markdown内容のプレビュー更新と文字数カウント更新
function updatePreview() {
    // Data‑URL として生成される文字列の長さを表示（" chars" 表記）
    charCount.textContent = generateDataUrl().length + " chars";
    previewContent.innerHTML = marked.parse(markdownInput.value);
}

// default.md をフェッチしてデフォルトスニペットを読み込む
function loadDefaultSnippet() {
    fetch('README.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('network response was not ok');
            }
            return response.text();
        })
        .then(text => {
            markdownInput.value = text;
            updatePreview();
        })
        .catch(error => {
            console.error('failed to load default snippet:', error);
        });
}

// URLハッシュとクエリから Markdown を復元する処理
function loadFromHash() {
    const params = new URLSearchParams(location.search);
    const theme = params.get('t') || 'default';
    themeSelect.value = theme;
    updateTheme();

    if (location.hash.startsWith('#d=')) {
        const compressed = location.hash.slice(3); // "#d=" の後ろ
        const markdown = LZString.decompressFromEncodedURIComponent(compressed);
        markdownInput.value = markdown;
        updatePreview();
        // data-url で開かれた場合は自動でエディタを折りたたむ
        container.classList.add('collapsed');
        toggleEditorBtn.textContent = "expand";
    } else if (markdownInput.value.trim() === "") {
        // ハッシュがない、またはエディタが空の場合は default.md を読み込む
        loadDefaultSnippet();
    }
}

// エディタの折りたたみ／展開の切替
toggleEditorBtn.addEventListener('click', () => {
    if (container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        toggleEditorBtn.textContent = "collapse";
    } else {
        container.classList.add('collapsed');
        toggleEditorBtn.textContent = "expand";
    }
});

// 入力イベントでプレビュー更新
markdownInput.addEventListener('input', updatePreview);
themeSelect.addEventListener('change', updateTheme);

// ダウンロードボタン：Markdownファイルとして保存
downloadBtn.addEventListener('click', () => {
    const blob = new Blob([markdownInput.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Data‑URL機能：LZ‑string で圧縮し、短縮パラメータ名で URL を生成・更新・コピー
dataUrlBtn.addEventListener('click', () => {
    // エディタ部を折りたたむ
    container.classList.add('collapsed');
    toggleEditorBtn.textContent = "expand";

    const newUrl = generateDataUrl();
    history.pushState(null, '', newUrl);

    // クリップボードへコピー
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(newUrl).then(() => {
            alert("url copied to clipboard!");
        }).catch((err) => {
            window.prompt("copy the url:", newUrl);
        });
    } else {
        window.prompt("copy the url:", newUrl);
    }
});

// ページ読み込み時およびハッシュ変更時に内容を復元
window.addEventListener('load', loadFromHash);
window.addEventListener('hashchange', loadFromHash);

// 初期処理：テーマとプレビューの更新
updateTheme();
updatePreview();
