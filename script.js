// import "./StarBorder.css";

document.addEventListener('DOMContentLoaded', () => {
    console.log('EduBlock UI Loaded');
    
    // Drag-and-Drop and File Input Elements
    const uploadSection = document.getElementById('upload-section');
    const verifySection = document.getElementById('verify-section');
    const uploadInput = document.getElementById('upload-input');
    const verifyInput = document.getElementById('verify-input');
    const uploadDetails = document.getElementById('upload-details');
    const verifyDetails = document.getElementById('verify-details');

    let uploadedFile = null;

    // QR Code Container
    const qrCodeContainer = document.getElementById('qr-code-container');
    const downloadQRButton = document.getElementById('download-qr');
    // const exitQRButton = document.getElementById('exit-qr');

    // Function to handle file details display
    function displayFileDetails(file, detailsElement) {
        const fileSizeInKB = (file.size / 1024).toFixed(2);
        detailsElement.innerHTML = `
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>File Size:</strong> ${fileSizeInKB} KB</p>
            <p><strong>File Type:</strong> ${file.type || 'Unknown'}</p>
        `;
    }

    // Function to handle file selection
    function handleFileSelection(event, inputElement, detailsElement) {
        const files = event.dataTransfer ? event.dataTransfer.files : inputElement.files;
        if (files.length > 0) {
            const file = files[0];
            displayFileDetails(file, detailsElement);

            // Store the uploaded file for comparison
            if (inputElement === uploadInput) {
                uploadedFile = file;
            } else if (inputElement === verifyInput) {
                verifyCertificate(file);
            }
        }
    }

    // Function to compare files
    function verifyCertificate(fileToVerify) {
        if (!uploadedFile) {
            showPopupMessage('No file uploaded to compare.', 'red');
            return;
        }

        const reader1 = new FileReader();
        const reader2 = new FileReader();

        // Use Promises to handle asynchronous FileReader operations
        const readFileAsArrayBuffer = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(file);
            });
        };

        // Compare files using Promises
        Promise.all([readFileAsArrayBuffer(uploadedFile), readFileAsArrayBuffer(fileToVerify)])
            .then(([buffer1, buffer2]) => {
                // Compare ArrayBuffer contents
                const uint8Array1 = new Uint8Array(buffer1);
                const uint8Array2 = new Uint8Array(buffer2);

                if (uint8Array1.length !== uint8Array2.length) {
                    showPopupMessage('Verification Unsuccessful ✗', 'red');
                    return;
                }

                for (let i = 0; i < uint8Array1.length; i++) {
                    if (uint8Array1[i] !== uint8Array2[i]) {
                        showPopupMessage('Verification Unsuccessful ✗', 'red');
                        return;
                    }
                }

                showPopupMessage('Verification Successful ✔', 'blue');
                setTimeout(() => generateQRCodeWithDetails(uploadedFile), 4000); // Show QR code after 10 seconds
            })
            .catch((error) => {
                console.error('Error reading files:', error);
                showPopupMessage('An error occurred while verifying the files.', 'red');
            });
    }

    // Function to display popup messages
    function showPopupMessage(message, color) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = color;
        popup.style.color = '#fff';
        popup.style.padding = '20px 40px';
        popup.style.borderRadius = '8px';
        popup.style.zIndex = '1000';
        popup.style.fontSize = '18px';
        popup.style.fontWeight = 'bold';
        popup.textContent = message;

        document.body.appendChild(popup);

        // Remove the popup after 3 seconds
        setTimeout(() => {
            popup.remove();
        }, 3000);
        // Remove the qr code popup after 3 seconds
        setTimeout(() => {
            qrCodeContainer.remove();
        }, 8000);

    }

    // Function to generate QR Code with details
    function generateQRCodeWithDetails(file) {

        // Reset the QR Code container
        qrCodeContainer.style.display = 'none'; // Hide the container initially
        document.getElementById('qr-code').innerHTML = ''; // Clear any existing QR code

        // Create dynamic HTML content for the webpage
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Certificate Details</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; }
                    h1 { color: #333; }
                    img { max-width: 100%; height: auto; border: 1px solid #ddd; padding: 5px; background: #fff; }
                    p { margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>Certificate Details</h1>
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                <p><strong>File Type:</strong> ${file.type || 'Unknown'}</p>
                <img src="${URL.createObjectURL(file)}" alt="Certificate Image">
            </body>
            </html>
        `;

        // Create a Blob for the HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const fileUrl = URL.createObjectURL(blob);

        // Generate QR Code with the HTML file URL
        const qrcode = new QRCode(document.getElementById('qr-code'), {
            text: fileUrl,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // Show the QR Code container after 4 seconds
        qrCodeContainer.style.display = 'flex';

        // Download QR Code as an image
        downloadQRButton.onclick = () => {
            const canvas = document.querySelector('#qr-code canvas');
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${file.name}-QRCode.png`;
            link.click();
        };

        // // Exit QR Code view
        // exitQRButton.onclick = () => {
        //     qrCodeContainer.style.display = 'none';
        //     document.getElementById('qr-code').innerHTML = ''; // Clear the QR Code
        // };
    }

    // Drag-and-Drop Events
    [uploadSection, verifySection].forEach((section) => {
        section.addEventListener('dragover', (event) => {
            event.preventDefault();
            section.classList.add('dragging');
        });

        section.addEventListener('dragleave', () => {
            section.classList.remove('dragging');
        });

        section.addEventListener('drop', (event) => {
            event.preventDefault();
            section.classList.remove('dragging');
            if (section === uploadSection) {
                handleFileSelection(event, uploadInput, uploadDetails);
            } else if (section === verifySection) {
                handleFileSelection(event, verifyInput, verifyDetails);
            }
        });

        // Click event to open file manager
        section.addEventListener('click', () => {
            if (section === uploadSection) {
                uploadInput.click();
            } else if (section === verifySection) {
                verifyInput.click();
            }
        });
    });

    // File Input Change Events
    uploadInput.addEventListener('change', (event) => handleFileSelection(event, uploadInput, uploadDetails));
    verifyInput.addEventListener('change', (event) => handleFileSelection(event, verifyInput, verifyDetails));
});
