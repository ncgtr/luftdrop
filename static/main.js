const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const archiveList = document.getElementById('archiveList');
const purgeBtn = document.getElementById('purgeBtn');

window.addEventListener('DOMContentLoaded', loadArchiveIndex);
setInterval(loadArchiveIndex, 2000);

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        processUploadQueue(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        processUploadQueue(fileInput.files);
    }
});

async function loadArchiveIndex() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
        const response = await fetch('/files', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        archiveList.innerHTML = ''; 
        
        if (data.files.length === 0) {
            archiveList.innerHTML = '<p class="empty-text">No shared files in archive yet.</p>';
            return;
        }

        data.files.forEach(filename => {
            const row = document.createElement('div');
            row.className = 'archive-item-container';

            const downloadLink = document.createElement('a');
            downloadLink.href = `/download/${encodeURIComponent(filename)}`;
            downloadLink.className = 'archive-item';
            downloadLink.setAttribute('download', filename); 
            downloadLink.innerHTML = `
                <span class="file-name">${filename}</span>
                <span class="download-icon">↓</span>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.title = `Delete ${filename}`;
            
            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const confirmed = confirm(`Are you sure you want to delete "${filename}"?`);
                if (!confirmed) return;

                try {
                    const deleteResponse = await fetch('/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ filename: filename })
                    });

                    if (deleteResponse.ok) {
                        statusText.textContent = `🗑️ Deleted: ${filename}`;
                        statusText.style.color = "#FF3B30";
                        
                        loadArchiveIndex();

                        setTimeout(() => {
                            statusText.textContent = "";
                            statusText.style.color = "var(--text)";
                        }, 3000);
                    } else {
                        const errData = await deleteResponse.json();
                        alert(`Failed to delete: ${errData.detail || 'Unknown error'}`);
                    }
                } catch (err) {
                    alert("Network error trying to delete file.");
                }
            });

            row.appendChild(downloadLink);
            row.appendChild(deleteBtn);
            archiveList.appendChild(row);
        });
    } catch (err) {
        clearTimeout(timeoutId);
        archiveList.innerHTML = `
            <p class="empty-text">
                ⚠️ Failed to sync with archive index. Connection was lost or an internal server error has occurred.
            </p>
        `;
    }
}

purgeBtn.addEventListener('click', async () => {
    const confirmed = confirm("Are you sure you want to delete ALL files from the server? This cannot be undone.");
    
    if (confirmed) {
        try {
            const response = await fetch('/purge', { method: 'DELETE' });
            
            if (response.ok) {
                statusText.textContent = "☢️ Server purged successfully.";
                statusText.style.color = "#FF3B30";

                loadArchiveIndex();
                
                setTimeout(() => {
                    statusText.textContent = "";
                    statusText.style.color = "var(--text)";
                }, 4000);
            } else {
                alert("Failed to purge the server. Check backend logs.");
            }
        } catch (err) {
            alert("Network error while attempting to purge.");
        }
    }
});

async function processUploadQueue(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    progressContainer.classList.remove('hidden');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const counterPrefix = files.length > 1 ? `(${i + 1}/${files.length}) ` : '';
        statusText.textContent = `Sending ${counterPrefix}${file.name}...`;

        try {
            await executeSingleUpload(file);
        } catch (error) {
            statusText.textContent = `❌ Error transmitting: ${file.name}`;
            progressBar.style.background = "#FF3B30";
            fileInput.value = '';
            return;
        }
    }

    statusText.textContent = "✅ File shared successfully!";
    progressBar.style.background = "#34C759";
    fileInput.value = '';

    loadArchiveIndex();

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        statusText.textContent = "";
    }, 3000);
}

function executeSingleUpload(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        progressBar.style.width = '0%';
        progressBar.style.background = 'var(--primary)';

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve();
            } else {
                reject(new Error());
            }
        };

        xhr.onerror = () => reject(new Error());
        xhr.send(formData);
    });
}