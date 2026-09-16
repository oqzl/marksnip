const markdownInput = document.getElementById('markdownInput');
const previewContent = document.getElementById('previewContent');
const previewContainer = document.querySelector('.preview');
const getMdBtn = document.getElementById('getMdBtn');
const getPdfBtn = document.getElementById('getPdfBtn');
const shareUrlBtn = document.getElementById('shareUrlBtn');
const toggleEditorBtn = document.getElementById('toggleEditorBtn');
const themeSelect = document.getElementById('themeSelect');
const container = document.querySelector('.container');
const charCount = document.getElementById('charCount');

const DEFAULT_MARKDOWN = `# marksnip

Markdown that lives in the URL.

Write something, then share the URL.`;

function generateDataUrl() {
    const compressedMarkdown = LZString.compressToEncodedURIComponent(markdownInput.value);
    return location.origin + location.pathname +
        '?t=' + encodeURIComponent(themeSelect.value) +
        '#d=' + compressedMarkdown;
}

function updateTheme() {
    previewContainer.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
            previewContainer.classList.remove(cls);
        }
    });
    previewContainer.classList.add('theme-' + themeSelect.value);
}

function updatePreview() {
    charCount.textContent = generateDataUrl().length + ' chars';
    previewContent.innerHTML = marked.parse(markdownInput.value);
}

function loadDefaultSnippet() {
    markdownInput.value = DEFAULT_MARKDOWN;
    updatePreview();
}

function loadFromHash() {
    const params = new URLSearchParams(location.search);
    const theme = params.get('t') || 'default';
    themeSelect.value = theme;
    updateTheme();

    if (location.hash.startsWith('#d=')) {
        const compressed = location.hash.slice(3);
        const markdown = LZString.decompressFromEncodedURIComponent(compressed);
        if (markdown !== null) {
            markdownInput.value = markdown;
            updatePreview();
            container.classList.add('collapsed');
            toggleEditorBtn.textContent = 'edit';
            return;
        }
    }

    loadDefaultSnippet();
}

toggleEditorBtn.addEventListener('click', () => {
    if (container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        toggleEditorBtn.textContent = 'view';
    } else {
        container.classList.add('collapsed');
        toggleEditorBtn.textContent = 'edit';
    }
});

markdownInput.addEventListener('input', updatePreview);
themeSelect.addEventListener('change', () => {
    updateTheme();
    updatePreview();
});

getMdBtn.addEventListener('click', () => {
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

getPdfBtn.addEventListener('click', () => {
    html2pdf()
        .from(previewContainer)
        .set({
            margin: 0,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: window.devicePixelRatio > 1 ? 1.5 : 2,
                logging: false,
                useCORS: true,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save('document.pdf');
});

shareUrlBtn.addEventListener('click', () => {
    const newUrl = generateDataUrl();
    history.pushState(null, '', newUrl);

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(newUrl)
            .then(() => alert('url copied to clipboard!'))
            .catch(() => window.prompt('copy the url:', newUrl));
    } else {
        window.prompt('copy the url:', newUrl);
    }
});

window.addEventListener('load', loadFromHash);
window.addEventListener('hashchange', loadFromHash);

updateTheme();
updatePreview();
