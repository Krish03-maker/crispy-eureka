/* ============================================
   QR Craft — Application Logic
   ============================================ */

(() => {
  'use strict';

  // --- DOM References ---
  const urlInput      = document.getElementById('url-input');
  const fgColorInput  = document.getElementById('fg-color');
  const bgColorInput  = document.getElementById('bg-color');
  const fgHex         = document.getElementById('fg-hex');
  const bgHex         = document.getElementById('bg-hex');
  const logoUpload    = document.getElementById('logo-upload');
  const uploadArea    = document.getElementById('upload-area');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const uploadPreview = document.getElementById('upload-preview');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const removeLogo    = document.getElementById('remove-logo');
  const generateBtn   = document.getElementById('generate-btn');
  const btnLoader     = document.getElementById('btn-loader');
  const previewEmpty  = document.getElementById('preview-empty');
  const qrOutput      = document.getElementById('qr-output');
  const previewActions = document.getElementById('preview-actions');
  const downloadPng   = document.getElementById('download-png');
  const downloadSvg   = document.getElementById('download-svg');
  const dotBtns       = document.querySelectorAll('.dot-btn');

  // --- State ---
  let logoDataUrl = null;
  let currentQR   = null;
  let dotStyle    = 'rounded';

  // --- Color Inputs ---
  fgColorInput.addEventListener('input', () => {
    fgHex.textContent = fgColorInput.value;
  });

  bgColorInput.addEventListener('input', () => {
    bgHex.textContent = bgColorInput.value;
  });

  // --- Dot Style Selection ---
  dotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dotBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dotStyle = btn.dataset.style;
    });
  });

  // --- Logo Upload ---
  uploadArea.addEventListener('click', () => logoUpload.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleLogoFile(file);
    }
  });

  logoUpload.addEventListener('change', () => {
    const file = logoUpload.files[0];
    if (file) handleLogoFile(file);
  });

  removeLogo.addEventListener('click', (e) => {
    e.stopPropagation();
    clearLogo();
  });

  function handleLogoFile(file) {
    if (file.size > 2 * 1024 * 1024) {
      showToast('File too large. Max 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      logoDataUrl = e.target.result;
      logoPreviewImg.src = logoDataUrl;
      uploadPlaceholder.hidden = true;
      uploadPreview.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    logoDataUrl = null;
    logoUpload.value = '';
    uploadPlaceholder.hidden = false;
    uploadPreview.hidden = true;
  }

  // --- Validation ---
  function isValidUrl(str) {
    // Accept anything that looks like a URL or is just text content for QR
    if (!str.trim()) return false;
    return true;
  }

  // --- Generate QR ---
  generateBtn.addEventListener('click', generateQR);

  // Also generate on Enter key in URL input
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateQR();
  });

  function generateQR() {
    const url = urlInput.value.trim();

    // Validate
    if (!url) {
      urlInput.classList.add('input-error', 'shake');
      urlInput.focus();
      setTimeout(() => {
        urlInput.classList.remove('input-error', 'shake');
      }, 800);
      showToast('Please enter a URL or text', 'error');
      return;
    }

    // Show loader
    generateBtn.disabled = true;
    btnLoader.hidden = false;
    generateBtn.querySelector('.btn-text').style.opacity = '0.5';

    // Clear previous
    qrOutput.innerHTML = '';

    // Build config
    const config = {
      width: 300,
      height: 300,
      data: url,
      margin: 8,
      dotsOptions: {
        color: fgColorInput.value,
        type: dotStyle,
      },
      backgroundOptions: {
        color: bgColorInput.value,
      },
      cornersSquareOptions: {
        type: dotStyle === 'dots' ? 'dot' : 'extra-rounded',
        color: fgColorInput.value,
      },
      cornersDotOptions: {
        type: dotStyle === 'dots' ? 'dot' : undefined,
        color: fgColorInput.value,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: 0.35,
      },
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    };

    if (logoDataUrl) {
      config.image = logoDataUrl;
    }

    // Small artificial delay for polish feel
    setTimeout(() => {
      try {
        currentQR = new QRCodeStyling(config);

        // Render
        previewEmpty.hidden = true;
        qrOutput.hidden = false;
        currentQR.append(qrOutput);

        // Show download actions
        previewActions.hidden = false;

        // Button success state
        generateBtn.classList.add('success');
        setTimeout(() => {
          generateBtn.classList.remove('success');
          generateBtn.querySelector('.btn-text').style.opacity = '';
        }, 1200);

        showToast('QR code generated!', 'success');
      } catch (err) {
        showToast('Error generating QR code', 'error');
        console.error(err);
      } finally {
        generateBtn.disabled = false;
        btnLoader.hidden = true;
      }
    }, 400);
  }

  // --- Downloads ---
  downloadPng.addEventListener('click', () => {
    if (!currentQR) return;
    currentQR.download({ name: 'qr-craft', extension: 'png' });
    showToast('Downloading PNG…', 'success');
  });

  downloadSvg.addEventListener('click', () => {
    if (!currentQR) return;
    currentQR.download({ name: 'qr-craft', extension: 'svg' });
    showToast('Downloading SVG…', 'success');
  });

  // --- Toast ---
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  // --- Focus glow on URL input on page load ---
  setTimeout(() => urlInput.focus(), 600);

})();
