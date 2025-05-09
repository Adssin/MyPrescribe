document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const resultArea = document.getElementById('resultArea');
    const predictionText = document.getElementById('predictionText');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const probabilityList = document.getElementById('probabilityList');
    const symptomsSummary = document.getElementById('symptomsSummary');

    console.log('DOM loaded, initializing elements...');

    // Initialize preview image
    previewArea.classList.add('d-none');

    // Handle file input through click
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }

    // Handle file drop
    uploadArea.addEventListener('drop', function(e) {
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewArea.classList.remove('d-none');
                resultArea.classList.add('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            showError('Please upload an image file.');
        }
    }

    function showError(message) {
        console.error('Error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => {
                errorDiv.remove();
            }, 400);
        }, 3000);
    }

    window.proceedToSymptoms = function() {
        step1.classList.add('d-none');
        step2.classList.remove('d-none');
    }

    window.goBackToUpload = function() {
        step2.classList.add('d-none');
        step1.classList.remove('d-none');
    }

    window.startOver = function() {
        fileInput.value = '';
        document.getElementById('symptomsForm').reset();
        resultArea.classList.add('d-none');
        step1.classList.remove('d-none');
        previewArea.classList.add('d-none');
    }

    function formatClassName(className) {
        return className.replace(/_/g, ' ');
    }

    window.analyzeImage = async function() {
        try {
            const file = fileInput.files[0];
            if (!file) {
                showError('Please select an image first.');
                return;
            }

            // Get form data
            const age = document.getElementById('age').value;
            const duration = document.getElementById('duration').value;
            const symptoms = {
                itching: document.getElementById('itching').checked,
                burning: document.getElementById('burning').checked,
                pain: document.getElementById('pain').checked,
                redness: document.getElementById('redness').checked
            };
            const notes = document.getElementById('additionalNotes').value;

            // Prepare form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('age', age);
            formData.append('duration', duration);
            formData.append('symptoms', JSON.stringify(symptoms));
            formData.append('notes', notes);

            // Show loading state
            const analyzeBtn = event.target;
            const originalText = analyzeBtn.innerHTML;
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze image');
            }

            const result = await response.json();

            // Update UI with results
            step2.classList.add('d-none');
            resultArea.classList.remove('d-none');

            // Update prediction text and confidence
            predictionText.textContent = formatClassName(result.predicted_class);
            const confidence = Math.round(result.confidence * 100);
            confidenceBar.style.width = `${confidence}%`;
            confidenceBar.setAttribute('aria-valuenow', confidence);
            confidenceText.textContent = `${confidence}% confidence`;

            // Update symptoms summary
            symptomsSummary.innerHTML = `
                <div class="list-group-item">
                    <strong>Age:</strong> ${age} years
                </div>
                <div class="list-group-item">
                    <strong>Duration:</strong> ${duration.replace(/_/g, ' ')}
                </div>
                <div class="list-group-item">
                    <strong>Symptoms:</strong><br>
                    ${Object.entries(symptoms)
                        .filter(([_, value]) => value)
                        .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                        .join(', ') || 'None reported'}
                </div>
                ${notes ? `
                <div class="list-group-item">
                    <strong>Additional Notes:</strong><br>
                    ${notes}
                </div>` : ''}
            `;

            // Update probability list
            probabilityList.innerHTML = '';
            Object.entries(result.class_probabilities)
                .sort(([, a], [, b]) => b - a)
                .forEach(([className, probability]) => {
                    const percentage = Math.round(probability * 100);
                    const listItem = document.createElement('div');
                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    listItem.innerHTML = `
                        <span>${formatClassName(className)}</span>
                        <span class="badge bg-primary rounded-pill">${percentage}%</span>
                    `;
                    probabilityList.appendChild(listItem);
                });

        } catch (error) {
            console.error('Analysis error:', error);
            showError(error.message || 'An error occurred while analyzing the image.');
        } finally {
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = originalText;
        }
    }
}); 