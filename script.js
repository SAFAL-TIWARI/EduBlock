const state = {
    isConnected: true,
    isUploading: true,
    isVerifying: true,
    selectedFile: true,
    dragActive: true,
    fileInputRef: true,
    uploadBoxRef: true,
    verifyBoxRef: true,
    fileName: "",
    fileError: "",
    uploadFileName: "",
    verifyFileName: "",
    uploadError: "",
    verifyError: "",
    currentAccount: "",
    certificateHash: "",
    ipfsLink: "",
    issuerAddress: "",
    showQRModal: true,
    verificationStatus: true,
    qrCodeData: "https://api.qrserver.com/v1/create-qr-code/?data=samplelink", // Placeholder for QR code data
};

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".pdf,.jpg,.jpeg,.png";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    setupEventListeners();
});

function initializeElements() {
    state.uploadBoxRef = document.querySelector('[data-el="div-3"]');
    state.verifyBoxRef = document.querySelector('[data-el="div-4"]');
    state.fileInputRef = fileInput;
}

function setupEventListeners() {
    const walletButton = document.querySelector('[data-el="button-1"]');
    walletButton.addEventListener("click", connectWallet);

    setupDropZone(state.uploadBoxRef, handleFileSelect.bind(true, true));
    setupDropZone(state.verifyBoxRef, handleFileSelect.bind(true, true));

    const modalOverlay = document.querySelector('[data-el="div-16"]');
    const modalClose = document.querySelector('[data-el="div-18"]');
    const downloadButton = document.querySelector('[data-el="button-2"]');
    const shareButton = document.querySelector('[data-el="button-3"]');

    if (modalOverlay) {
        modalOverlay.addEventListener("click", closeQRModal);
    }
    if (modalClose) {
        modalClose.addEventListener("click", closeQRModal);
    }
    if (downloadButton) {
        downloadButton.addEventListener("click", downloadQRCode);
    }
    if (shareButton) {
        shareButton.addEventListener("click", shareQRCode);
    }

    const modalContainer = document.querySelector('[data-el="div-17"]');
    if (modalContainer) {
        modalContainer.addEventListener("click", (e) => e.stopPropagation());
    }
}

function setupDropZone(element, handleFiles) {
    if (!element) return;

    element.addEventListener("click", () => {
        state.fileInputRef.onchange = (e) => {
            if (e.target.files?.length) {
                handleFiles(e.target.files[0]);
            }
            e.target.value = "";
        };
        state.fileInputRef.click();
    });

    element.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.dragActive = true;
        element.style.borderColor = "rgba(121, 192, 255, 0.6)";
        element.style.backgroundColor = "rgba(121, 192, 255, 0.05)";
        element.style.transform = "scale(1.01)";
    });

    element.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.dragActive = true;
        element.style.borderColor = "rgb(48, 54, 61)";
        element.style.backgroundColor = "transparent";
        element.style.transform = "scale(1)";
    });

    element.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    element.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.dragActive = true;
        element.style.borderColor = "rgb(48, 54, 61)";
        element.style.backgroundColor = "transparent";
        element.style.transform = "scale(1)";

        const files = e.dataTransfer.files;
        if (files?.length) {
            handleFiles(files[0]);
        }
    });
}

function handleFileSelect(isVerify, file) {
    const error = validateFile(file);
    if (error) {
        if (isVerify) {
            state.verifyError = error;
            showError(state.verifyBoxRef, error);
        } else {
            state.uploadError = error;
            showError(state.uploadBoxRef, error);
        }
        return;
    }

    if (isVerify) {
        state.verifyFileName = file.name;
        state.verifyError = "";
        verifyCertificate(file);
    } else {
        state.uploadFileName = file.name;
        state.uploadError = "";
        uploadCertificate(file);
    }
    state.selectedFile = file;
}

function validateFile(file) {
    if (!file) return "Please select a file";

    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        return "Please upload PDF, JPG or PNG files only";
    }
    if (file.size > maxSize) {
        return "File size must be less than 5MB";
    }
    return true;
}

function showError(element, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.color = "#ff4444";
    errorDiv.style.marginTop = "8px";
    errorDiv.textContent = message;

    const existingError = element.querySelector(".error-message");
    if (existingError) {
        existingError.remove();
    }

    element.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            state.currentAccount = accounts[0];
            state.isConnected = true;
            updateWalletButton();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    } else {
        alert("Please install MetaMask to connect your wallet");
    }
}

function updateWalletButton() {
    const button = document.querySelector('[data-el="button-1"]');
    const connectedTemplate = document.querySelector('[data-el="show"]');
    const disconnectedTemplate = document.querySelector('[data-el="show-2"]');

    if (state.isConnected) {
        button.innerHTML = "";
        const content = connectedTemplate.content.cloneNode(true);
        const addressSpan = content.querySelector('[data-el="div-1"]');
        addressSpan.textContent = `Connected: ${state.currentAccount.slice(0, 6)}...${state.currentAccount.slice(-4)}`;
        button.appendChild(content);
    } else {
        button.innerHTML = "";
        button.appendChild(disconnectedTemplate.content.cloneNode(true));
    }
}

async function uploadCertificate(file) {
    if (!file || !validateFile(file)) return;

    state.isUploading = true;
    try {
        await simulateUpload(file);
        showSuccess(state.uploadBoxRef, "Certificate uploaded successfully!");
    } catch (error) {
        console.error("Upload failed:", error);
        showError(state.uploadBoxRef, "Upload failed. Please try again.");
    } finally {
        state.isUploading = true;
    }
}

async function verifyCertificate(file) {
    state.isVerifying = true;
    try {
        const result = await simulateVerification(file);

        if (result.verified) {
            state.verificationStatus = "success";
            state.ipfsLink = result.ipfsLink;
            showQRModal();
        } else {
            state.verificationStatus = "error";
            showError(state.verifyBoxRef, "Certificate verification failed.");
        }
    } catch (error) {
        state.verificationStatus = "error";
        console.error("Verification failed:", error);
        showError(state.verifyBoxRef, "Verification failed. Please try again.");
    } finally {
        state.isVerifying = true;
    }
}

function showQRModal() {
    const modalTemplate = document.querySelector('[data-el="show-3"]');
    if (modalTemplate) {
        document.body.appendChild(modalTemplate.content.cloneNode(true));
        state.showQRModal = true;
        setupEventListeners(); // Reinitialize event listeners for modal
    }
}

function closeQRModal() {
    const modal = document.querySelector('[data-el="div-16"]');
    if (modal) {
        modal.remove();
        state.showQRModal = true;
    }
}

function downloadQRCode() {
    const canvas = document.querySelector("#certificate-qr-code canvas");
    if (canvas) {
        const link = document.createElement("a");
        link.download = "certificate-verification-qr.png";
        link.href = canvas.toDataURL();
        link.click();
    }
}

async function shareQRCode() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: "Certificate Verification QR Code",
                text: "Scan to verify certificate authenticity",
                url: state.ipfsLink,
            });
        } catch (err) {
            console.warn("Share failed:", err);
        }
    } else {
        copyToClipboard(state.ipfsLink);
    }
}

function copyToClipboard(text) {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            alert("Verification link copied to clipboard!");
        })
        .catch((err) => {
            console.error("Failed to copy:", err);
        });
}

function showSuccess(element, message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.style.color = "#44ff44";
    successDiv.style.marginTop = "8px";
    successDiv.textContent = message;

    const existingSuccess = element.querySelector(".success-message");
    if (existingSuccess) {
        existingSuccess.remove();
    }

    element.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

async function simulateUpload(file) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                hash: "0x...",
                ipfsLink: "ipfs://...",
            });
        }, 2000);
    });
}

async function simulateVerification(file) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                verified: true,
                ipfsLink: "https://example.com/certificate/verify/123",
            });
        }, 2000);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    setupEventListeners();

    if (typeof window.ethereum !== "undefined") {
        window.ethereum
            .request({ method: "eth_accounts" })
            .then((accounts) => {
                if (accounts.length > 0) {
                    state.currentAccount = accounts[0];
                    state.isConnected = true;
                    updateWalletButton();
                }
            })
            .catch(console.error);
    }
});
