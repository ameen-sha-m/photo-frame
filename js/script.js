
const canvas = document.getElementById("posterCanvas");
const ctx = canvas.getContext("2d");

const photoInput = document.getElementById("photoInput");
const zoomInput = document.getElementById("zoom");
const horizontalInput = document.getElementById("horizontal");
const verticalInput = document.getElementById("vertical");

const resetButton = document.getElementById("resetBtn");
const downloadButton = document.getElementById("downloadBtn");
const statusMessage = document.getElementById("statusMessage");

const background = new Image();
const foreground = new Image();

let uploadedPhoto = null;
let backgroundLoaded = false;
let foregroundLoaded = false;

// IMPORTANT:
// Replace these example values with the actual photo area
// measured from your poster.
//
// All values are percentages represented as decimals.
const photoArea = {
    x: 0.20,
    y: 0.20,
    width: 0.60,
    height: 0.70
};

// Display status messages
function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message " + type;
}

// Load background image
background.onload = function () {
    backgroundLoaded = true;

    canvas.width = background.naturalWidth;
    canvas.height = background.naturalHeight;

    checkReady();
};

background.onerror = function () {
    setStatus(
        "Could not load poster-background.png. Check your assets folder.",
        "error"
    );
};

// Load foreground image
foreground.onload = function () {
    foregroundLoaded = true;
    checkReady();
};

foreground.onerror = function () {
    setStatus(
        "Could not load poster-foreground.png. Check your assets folder.",
        "error"
    );
};

// Set image paths
background.src = "assets/poster-background.png";
foreground.src = "assets/poster-foreground.png";

// Check whether both poster layers are ready
function checkReady() {
    if (backgroundLoaded && foregroundLoaded) {
        drawPoster();
        setStatus("Poster template loaded. Upload your photo.", "success");
    }
}

// Upload photo
photoInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        setStatus("Please upload a JPG, PNG or WebP image.", "error");
        photoInput.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        setStatus("Your photo must be smaller than 10 MB.", "error");
        photoInput.value = "";
        return;
    }

    const imageURL = URL.createObjectURL(file);
    const image = new Image();

    image.onload = function () {
        uploadedPhoto = image;

        // Release the temporary object URL after loading
        URL.revokeObjectURL(imageURL);

        drawPoster();
        setStatus("Photo uploaded successfully!", "success");
    };

    image.onerror = function () {
        URL.revokeObjectURL(imageURL);
        setStatus("Could not open this image. Try another photo.", "error");
        photoInput.value = "";
    };

    image.src = imageURL;
});

// Draw the poster
function drawPoster() {
    if (!backgroundLoaded || !foregroundLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // LAYER 1: Background
    ctx.drawImage(
        background,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // LAYER 2: User's uploaded photo
    if (uploadedPhoto) {
        const x = photoArea.x * canvas.width;
        const y = photoArea.y * canvas.height;

        const width = photoArea.width * canvas.width;
        const height = photoArea.height * canvas.height;

        const zoom = Number(zoomInput.value);

        // Scale photo to cover the entire photo area
        const scale = Math.max(
            width / uploadedPhoto.naturalWidth,
            height / uploadedPhoto.naturalHeight
        ) * zoom;

        const drawWidth = uploadedPhoto.naturalWidth * scale;
        const drawHeight = uploadedPhoto.naturalHeight * scale;

        const offsetX =
            Number(horizontalInput.value) / 100 * width;

        const offsetY =
            Number(verticalInput.value) / 100 * height;

        ctx.save();

        // Restrict photo to the designated area
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        ctx.drawImage(
            uploadedPhoto,
            x + (width - drawWidth) / 2 + offsetX,
            y + (height - drawHeight) / 2 + offsetY,
            drawWidth,
            drawHeight
        );

        ctx.restore();
    }

    // LAYER 3: Foreground design
    ctx.drawImage(
        foreground,
        0,
        0,
        canvas.width,
        canvas.height
    );
}

// Update preview when sliders move
zoomInput.addEventListener("input", drawPoster);
horizontalInput.addEventListener("input", drawPoster);
verticalInput.addEventListener("input", drawPoster);

// Reset adjustments
resetButton.addEventListener("click", function () {
    zoomInput.value = 1;
    horizontalInput.value = 0;
    verticalInput.value = 0;

    drawPoster();

    setStatus("Photo adjustments reset.", "success");
});

// Download final poster
downloadButton.addEventListener("click", function () {
    if (!backgroundLoaded || !foregroundLoaded) {
        setStatus("Please wait for the poster template to load.", "error");
        return;
    }

    if (!uploadedPhoto) {
        setStatus("Please upload your photo first.", "error");
        return;
    }

    try {
        const downloadLink = document.createElement("a");

        downloadLink.download = "campaign-poster.png";
        downloadLink.href = canvas.toDataURL("image/png");

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        setStatus("Your poster is ready to download!", "success");

    } catch (error) {
        setStatus("Download failed. Please try again.", "error");
        console.error(error);
    }
});
