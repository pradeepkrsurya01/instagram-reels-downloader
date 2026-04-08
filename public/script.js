const urlInput = document.getElementById('url');
const downloadBtn = document.getElementById('downloadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const resultSection = document.getElementById('result');

// Paste button functionality with better error handling
pasteBtn.addEventListener('click', async () => {
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard) {
            showMessage('⚠️ Your browser doesn\'t support clipboard paste. Please paste manually.', 'info');
            urlInput.focus();
            return;
        }

        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            urlInput.value = text;
            urlInput.focus();
            showMessage('✅ URL pasted successfully!', 'success');
        } else {
            showMessage('⚠️ Clipboard is empty', 'info');
        }
    } catch (err) {
        // Clipboard permissions denied or not available
        showMessage('📋 Please paste manually or click the input field', 'info');
        urlInput.focus();
        // Try to focus for manual paste if keyboard shortcut
        urlInput.select();
    }
});

// Download button event listener
downloadBtn.addEventListener('click', download);

// Allow Enter key to trigger download
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        download();
    }
});

// Clear result when user starts typing new URL
urlInput.addEventListener('input', () => {
    if (resultSection.children.length > 0 && !resultSection.querySelector('.video-container')) {
        resultSection.innerHTML = '';
    }
});

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = message;
    resultSection.innerHTML = '';
    resultSection.appendChild(messageDiv);
}

function showLoading() {
    resultSection.innerHTML = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message info';
    messageDiv.innerHTML = '<span class="spinner"></span> Downloading your reel...';
    resultSection.appendChild(messageDiv);
    downloadBtn.disabled = true;
    downloadBtn.classList.add('loading');
}

async function download() {
    const url = urlInput.value.trim();

    if (!url) {
        showMessage('⚠️ Please paste an Instagram URL', 'error');
        urlInput.focus();
        return;
    }

    // Basic URL validation
    if (!url.includes('instagram.com')) {
        showMessage('⚠️ Please enter a valid Instagram URL (must contain instagram.com)', 'error');
        return;
    }

    // Check if URL contains reel, post, or story
    if (!url.includes('reel') && !url.includes('p/') && !url.includes('stories')) {
        showMessage('⚠️ Please use a direct Instagram reel, post, or story link', 'info');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        downloadBtn.disabled = false;
        downloadBtn.classList.remove('loading');

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            showMessage(`❌ ${errorData.message || 'Server error. Please try again.'}`, 'error');
            return;
        }

        const data = await response.json();

        if (data.status === 'success' && data.video) {
            displayVideo(data.video);
        } else {
            showMessage('❌ ' + (data.message || 'Invalid Instagram URL'), 'error');
        }
    } catch (error) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('loading');
        console.error('Fetch error:', error);
        showMessage('❌ Connection error. Please check your internet and try again.', 'error');
    }
}

function displayVideo(videoUrl) {
    resultSection.innerHTML = `
        <div class="video-container">
            <video controls>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="button-group">
                <a href="${videoUrl}" download="instagram-reel.mp4" class="btn-download-file">
                    <i class="fas fa-download"></i>
                    <span>Download</span>
                </a>
                <button class="btn-copy-link" onclick="copyToClipboard('${videoUrl}')">
                    <i class="fas fa-link"></i>
                    <span>Copy Link</span>
                </button>
            </div>
            <div class="message success" style="margin-top: 15px;">
                ✅ Success! Your reel is ready to download.
            </div>
        </div>
    `;
}

function copyToClipboard(text) {
    if (!navigator.clipboard) {
        // Fallback for browsers without clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMessage('✅ Link copied to clipboard!', 'success');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showMessage('✅ Link copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('❌ Failed to copy link', 'error');
    });
}
