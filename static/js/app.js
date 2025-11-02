// Emotion Detection App - Frontend JavaScript

// DOM Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const changeImageBtn = document.getElementById("changeImageBtn");
const loading = document.getElementById("loading");
const resultsSection = document.getElementById("resultsSection");
const analyzeAnotherBtn = document.getElementById("analyzeAnotherBtn");

// Emotion to emoji mapping
const emotionEmojis = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Surprise: "😲",
  Fear: "😨",
  Disgust: "🤢",
  Neutral: "😐",
};

// Emotion colors
const emotionColors = {
  Happy: "#FFD700",
  Sad: "#4169E1",
  Angry: "#DC143C",
  Surprise: "#FF69B4",
  Fear: "#9370DB",
  Disgust: "#32CD32",
  Neutral: "#808080",
};

let selectedFile = null;

// Initialize event listeners
function init() {
  // Upload area click
  uploadArea.addEventListener("click", () => fileInput.click());

  // File input change
  fileInput.addEventListener("change", handleFileSelect);

  // Drag and drop
  uploadArea.addEventListener("dragover", handleDragOver);
  uploadArea.addEventListener("dragleave", handleDragLeave);
  uploadArea.addEventListener("drop", handleDrop);

  // Button clicks
  analyzeBtn.addEventListener("click", analyzeImage);
  changeImageBtn.addEventListener("click", resetUpload);
  analyzeAnotherBtn.addEventListener("click", resetUpload);
}

// Handle file selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedFile = file;
    displayPreview(file);
  } else {
    showError("Please select a valid image file");
  }
}

// Handle drag over
function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add("dragover");
}

// Handle drag leave
function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
}

// Handle drop
function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedFile = file;
    fileInput.files = e.dataTransfer.files;
    displayPreview(file);
  } else {
    showError("Please drop a valid image file");
  }
}

// Display image preview
function displayPreview(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadArea.style.display = "none";
    previewArea.style.display = "block";
    analyzeBtn.style.display = "block";
    resultsSection.style.display = "none";
  };

  reader.readAsDataURL(file);
}

// Analyze image
async function analyzeImage() {
  if (!selectedFile) {
    showError("Please select an image first");
    return;
  }

  // Simplified validation - no user info required

  // Show loading
  analyzeBtn.style.display = "none";
  loading.style.display = "block";

  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", selectedFile);

    // Send request
    const response = await fetch("/api/detect", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      displayResults(data);
    } else {
      showError(data.error || "Failed to analyze image");
    }
  } catch (error) {
    showError("An error occurred: " + error.message);
  } finally {
    loading.style.display = "none";
  }
}

// Display results
function displayResults(data) {
  const { predictions, dominant_emotion } = data;

  // Update dominant emotion
  const dominantEmotionEl = document.getElementById("dominantEmotion");
  const emotionIcon = dominantEmotionEl.querySelector(".emotion-icon");
  const emotionText = document.getElementById("dominantEmotionText");
  const confidence = document.getElementById("dominantConfidence");

  emotionIcon.textContent = emotionEmojis[dominant_emotion] || "😊";
  emotionText.textContent = dominant_emotion;
  confidence.textContent = `${predictions[dominant_emotion].toFixed(1)}%`;

  // Update chart
  const chartEl = document.getElementById("emotionsChart");
  chartEl.innerHTML = "";

  // Sort emotions by confidence
  const sortedEmotions = Object.entries(predictions).sort(
    (a, b) => b[1] - a[1]
  );

  sortedEmotions.forEach(([emotion, probability], index) => {
    const barEl = createEmotionBar(emotion, probability);
    chartEl.appendChild(barEl);

    // Animate bar
    setTimeout(() => {
      const fill = barEl.querySelector(".bar-fill");
      fill.style.width = `${probability}%`;
    }, index * 100);
  });

  // Show results section
  resultsSection.style.display = "block";

  // Smooth scroll to results
  resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Create emotion bar element
function createEmotionBar(emotion, probability) {
  const barEl = document.createElement("div");
  barEl.className = "emotion-bar";

  const color = emotionColors[emotion] || "#6366f1";

  barEl.innerHTML = `
        <div class="emotion-label">${
          emotionEmojis[emotion] || "😊"
        } ${emotion}</div>
        <div class="bar-container">
            <div class="bar-fill" style="width: 0%; background: linear-gradient(90deg, ${color}, ${adjustColor(
    color,
    -20
  )});">
                <span class="bar-percentage">${probability.toFixed(1)}%</span>
            </div>
        </div>
    `;

  return barEl;
}

// Adjust color brightness
function adjustColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// Reset upload
function resetUpload() {
  selectedFile = null;
  fileInput.value = "";
  previewImage.src = "";
  uploadArea.style.display = "block";
  previewArea.style.display = "none";
  analyzeBtn.style.display = "none";
  resultsSection.style.display = "none";

  // Don't clear user info - keep it for next analysis
  // userName.value = "";
  // userEmail.value = "";

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Show error message
function showError(message) {
  alert("Error: " + message);
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
