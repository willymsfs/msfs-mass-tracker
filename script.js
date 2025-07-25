// --- CONFIGURATION ---
const GITHUB_USERNAME = "your-github-username"; // <-- CHANGE THIS
const REPO_NAME = "mass-tracker"; // <-- CHANGE THIS
const FILE_PATH = "data/db.json";
const GITHUB_TOKEN = "your_personal_access_token"; // <-- PASTE YOUR TOKEN HERE

// --- GLOBAL STATE ---
let dbData = {}; // This will hold all data from db.json
let currentYear, currentMonth;
let isDataDirty = false; // Track if there are unsaved changes

// --- CORE FUNCTIONS ---

// Function to fetch data from GitHub
async function loadDatabase() {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw', // Get raw content
            }
        });
        if (!response.ok) throw new Error(`Could not load database file. Status: ${response.status}`);
        dbData = await response.json();
        console.log("Database loaded successfully.");
    } catch (error) {
        console.error("Error loading database:", error);
        alert("Failed to load data from GitHub. Please check console for errors.");
    }
}

// Function to save data back to GitHub
async function saveDatabase() {
    if (!isDataDirty) {
        alert("No changes to save.");
        return;
    }

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        // 1. Get the current file SHA (required by GitHub API to update a file)
        const fileResponse = await fetch(url);
        const fileData = await fileResponse.json();
        const sha = fileData.sha;

        // 2. Prepare the content to be saved
        const content = JSON.stringify(dbData, null, 2); // Pretty print JSON
        const encodedContent = btoa(content); // Base64 encode the content

        // 3. Make the PUT request to update the file
        const saveResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Update mass data on ${new Date().toISOString()}`,
                content: encodedContent,
                sha: sha, // Provide the SHA of the file you're updating
            }),
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        alert("Data saved successfully to GitHub!");
        isDataDirty = false;
    } catch (error) {
        console.error("Error saving database:", error);
        alert(`Failed to save data. Error: ${error.message}`);
    }
}


// Function to draw the calendar for the selected month and year
function renderCalendar(year, month) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = ''; // Clear previous view
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        grid.innerHTML += `<div class="day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.dataset.date = dateStr;

        let entry = dbData.massIntentions.find(e => e.date === dateStr);
        // Here you would add more logic to check for deceased suffrages, personal intentions etc.
        
        let intentionText = "Click to add entry";
        if (entry) {
            dayDiv.classList.add(entry.type.toLowerCase().replace(/ /g, '-'));
            intentionText = entry.remarks || entry.type;
        }

        dayDiv.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="intention">${intentionText}</div>
        `;
        
        dayDiv.addEventListener('click', () => openEditModal(dateStr));
        grid.appendChild(dayDiv);
    }
}

function openEditModal(dateStr) {
    // This function will find the data for the clicked date,
    // populate the modal form fields, and display the modal.
    document.getElementById('edit-modal').classList.remove('modal-hidden');
    document.getElementById('modal-title').innerText = `Edit Mass for ${dateStr}`;
    // ... logic to fill form ...
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    // Populate year/month dropdowns
    const yearSelect = document.getElementById('year-select');
    for (let y = 2020; y <= 2030; y++) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
    // ... populate month dropdown ...

    // Set initial view
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    yearSelect.value = currentYear;
    // ... set month select value ...

    await loadDatabase();
    renderCalendar(currentYear, currentMonth);

    // Add event listeners for controls
    yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
    });
    // ... add month select listener ...
    document.getElementById('save-button').addEventListener('click', saveDatabase);
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('modal-hidden');
    });

    // ... add form submission listener ...
});

// You will need to build out the logic for serial number calculation,
// handling form submissions, and generating reports.
// This is a strong starting point.
