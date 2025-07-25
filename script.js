// Database initialization
const DB_NAME = 'MSFSMassTrackerDB';
const DB_VERSION = 1;
let db;

// Initialize the database
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('masses')) {
                db.createObjectStore('masses', { keyPath: 'date' });
            }
            
            if (!db.objectStoreNames.contains('suffrages')) {
                db.createObjectStore('suffrages', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('receptions')) {
                db.createObjectStore('receptions', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
                
                // Initialize default settings
                settingsStore.add({
                    id: 'currentSettings',
                    currentSerial: 300,
                    fixedIntentions: [
                        { day: 18, month: 0, occasion: "Gladwin Birthday" },
                        { day: 16, month: 1, occasion: "Dominic Birthday" },
                        { day: 2, month: 2, occasion: "Paritosh Birthday" },
                        { day: 4, month: 4, occasion: "Sophie Birthday" },
                        { day: 7, month: 8, occasion: "Daddy Birthday" },
                        { day: 17, month: 8, occasion: "Theodore Birthday" },
                        { day: 23, month: 8, occasion: "Regina Birthday" },
                        { day: 12, month: 10, occasion: "Anaya Birthday" },
                        { day: 20, month: 10, occasion: "Carmel Birthday" },
                        { day: 18, month: 11, occasion: "Mummy Death Anniversary" },
                        { day: 27, month: 0, occasion: "Ordination Anniversary" },
                        { day: 1, month: 6, occasion: "Eshban Birthday" },
                        { day: 16, month: 7, occasion: "Sr Synthia Birthday" },
                        { day: 27, month: 7, occasion: "Dada Death Anniversary" },
                        { day: 1, month: 11, occasion: "Sr. Sherly Birthday" },
                        { day: 20, month: 11, occasion: "Seeba Birthday" }
                    ],
                    goodFridays: ["2024-03-29", "2025-04-18", "2026-04-03"]
                });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Database operations
function getObjectStore(storeName, mode) {
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
}

async function getData(storeName, key) {
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readonly');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readonly');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveData(storeName, data) {
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readwrite');
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

async function deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readwrite');
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Helper functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMonthName(monthIndex) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[monthIndex];
}

function populateDropdown(id, start, end, isMonth = false) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    
    if (isMonth) {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            select.appendChild(option);
        });
    } else {
        for (let i = start; i <= end; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            select.appendChild(option);
        }
    }
}

// Application initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize database
        await initDatabase();
        
        // Load initial data if needed
        await loadInitialData();
        
        // Set up navigation
        setupNavigation();
        
        // Initialize dashboard
        await initDashboard();
        
        // Initialize other views
        await initMassEntry();
        await initPersonalIntentions();
        await initSuffrages();
        await initMassReceptions();
        await initReports();
        await initSettings();
        
        // Check for reminders
        await checkReminders();
        
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to initialize the application. Please try refreshing the page.');
    }
});

// Navigation setup
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewContents = document.querySelectorAll('.view-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('bg-blue-100', 'text-blue-800'));
            
            // Add active class to clicked button
            this.classList.add('bg-blue-100', 'text-blue-800');
            
            // Hide all views
            viewContents.forEach(view => view.classList.add('hidden'));
            
            // Show the selected view
            const viewId = this.id.replace('nav-', '') + '-view';
            document.getElementById(viewId).classList.remove('hidden');
        });
    });
    
    // Set dashboard as default active view
    document.getElementById('nav-dashboard').click();
}

// Dashboard functions
async function initDashboard() {
    // Populate year and month dropdowns
    populateDropdown('dashboard-year', 2020, 2030);
    populateDropdown('dashboard-month', 0, 11, true);
    
    // Set current month and year
    const currentDate = new Date();
    document.getElementById('dashboard-year').value = currentDate.getFullYear();
    document.getElementById('dashboard-month').value = currentDate.getMonth();
    
    // Set up event listeners
    document.getElementById('dashboard-year').addEventListener('change', () => updateDashboard());
    document.getElementById('dashboard-month').addEventListener('change', () => updateDashboard());
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    document.getElementById('quick-add-mass').addEventListener('click', quickAddMass);
    document.getElementById('quick-view-report').addEventListener('click', quickViewReport);
    
    // Update dashboard
    await updateDashboard();
}

async function updateDashboard() {
    const year = parseInt(document.getElementById('dashboard-year').value);
    const month = parseInt(document.getElementById('dashboard-month').value);
    
    // Update current month-year display
    document.getElementById('current-month-year').textContent = `${getMonthName(month)} ${year}`;
    
    // Generate calendar
    await generateCalendar('calendar-container', year, month);
    
    // Update stats
    await updateDashboardStats(year, month);
    
    // Update recent masses
    await updateRecentMasses();
}

async function generateCalendar(containerId, year, month) {
    const container = document.getElementById(containerId);
    const settings = await getData('settings', 'currentSettings');
    const allMasses = await getAllData('masses');
    const allSuffrages = await getAllData('suffrages');
    
    // Create calendar table
    let calendarHTML = `<table class="calendar w-full">
        <thead>
            <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Stop if we've rendered all days
        if (date > daysInMonth) break;
        
        calendarHTML += '<tr>';
        
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                // Empty cells before first day of month
                calendarHTML += '<td></td>';
            } else if (date > daysInMonth) {
                // Empty cells after last day of month
                calendarHTML += '<td></td>';
            } else {
                // Cell with date
                const currentDate = new Date(year, month, date);
                const dateStr = formatDate(currentDate);
                const isToday = isCurrentMonth && date === today.getDate();
                
                // Check if date has any masses
                const massData = allMasses.find(m => m.date === dateStr);
                const isGoodFriday = settings.goodFridays.includes(dateStr);
                const isSFSFeast = month === 0 && date === 24; // Jan 24
                
                // Check for personal intentions
                const isPersonalIntention = await checkPersonalIntention(date, month, year);
                
                // Check for suffrages
                const suffrage = allSuffrages.find(s => s.whenCelebrated === dateStr);
                
                let eventsHTML = '';
                
                // Add Good Friday marker
                if (isGoodFriday) {
                    eventsHTML += `<div class="calendar-event good-friday">Good Friday</div>`;
                }
                
                // Add SFS Feast Day marker
                if (isSFSFeast) {
                    eventsHTML += `<div class="calendar-event">SFS Feast Day</div>`;
                }
                
                // Add suffrage marker
                if (suffrage) {
                    eventsHTML += `<div class="calendar-event suffrage">Suffrage: ${suffrage.name.split(' ')[0]}</div>`;
                }
                
                // Add personal intention marker
                if (isPersonalIntention) {
                    const occasion = await getPersonalIntentionOccasion(date, month, year);
                    eventsHTML += `<div class="calendar-event personal">${occasion}</div>`;
                }
                
                // Add mass marker
                if (massData) {
                    const status = massData.status === 'celebrated' ? 'Celebrated' : 'Missed';
                    eventsHTML += `<div class="calendar-event">Mass: ${status}</div>`;
                }
                
                calendarHTML += `
                    <td onclick="showMassEntry('${dateStr}')" class="cursor-pointer hover:bg-gray-50">
                        <div class="calendar-day ${isToday ? 'today' : ''}">${date}</div>
                        ${eventsHTML}
                    </td>`;
                date++;
            }
        }
        
        calendarHTML += '</tr>';
    }
    
    calendarHTML += '</tbody></table>';
    container.innerHTML = calendarHTML;
}

async function updateDashboardStats(year, month) {
    const allMasses = await getAllData('masses');
    const monthStr = month < 9 ? `0${month + 1}` : month + 1;
    const monthPrefix = `${year}-${monthStr}`;
    
    // Calculate stats
    let celebrated = 0;
    let missed = 0;
    let personal = 0;
    
    allMasses.forEach(mass => {
        if (mass.date.startsWith(monthPrefix)) {
            if (mass.status === 'celebrated') {
                celebrated++;
                
                // Check if it's a personal intention
                const date = new Date(mass.date);
                if (await checkPersonalIntention(date.getDate(), date.getMonth(), date.getFullYear())) {
                    personal++;
                }
            } else {
                missed++;
            }
        }
    });
    
    // Update DOM
    const settings = await getData('settings', 'currentSettings');
    document.getElementById('stat-celebrated').textContent = celebrated;
    document.getElementById('stat-missed').textContent = missed;
    document.getElementById('stat-personal').textContent = `${personal}/3`;
    document.getElementById('stat-serial').textContent = settings.currentSerial;
}

async function updateRecentMasses() {
    const allMasses = await getAllData('masses');
    const tableBody = document.getElementById('recent-masses-table');
    tableBody.innerHTML = '';
    
    // Get last 5 masses (celebrated or missed)
    const recentMasses = allMasses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentMasses.forEach(mass => {
        const row = document.createElement('tr');
        row.className = mass.status === 'celebrated' ? 'bg-blue-50' : 'bg-red-50';
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${formatDateDisplay(mass.date)}</td>
            <td class="py-2 px-4 border">${mass.serial || ''}</td>
            <td class="py-2 px-4 border">${mass.purpose || ''}</td>
            <td class="py-2 px-4 border">${mass.from || ''}</td>
            <td class="py-2 px-4 border">
                <span class="status-badge ${mass.status === 'celebrated' ? 'completed' : 'missed'}">
                    ${mass.status === 'celebrated' ? 'Celebrated' : 'Missed'}
                </span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function prevMonth() {
    const monthSelect = document.getElementById('dashboard-month');
    const yearSelect = document.getElementById('dashboard-year');
    
    let month = parseInt(monthSelect.value);
    let year = parseInt(yearSelect.value);
    
    if (month === 0) {
        month = 11;
        year--;
    } else {
        month--;
    }
    
    monthSelect.value = month;
    yearSelect.value = year;
    await updateDashboard();
}

async function nextMonth() {
    const monthSelect = document.getElementById('dashboard-month');
    const yearSelect = document.getElementById('dashboard-year');
    
    let month = parseInt(monthSelect.value);
    let year = parseInt(yearSelect.value);
    
    if (month === 11) {
        month = 0;
        year++;
    } else {
        month++;
    }
    
    monthSelect.value = month;
    yearSelect.value = year;
    await updateDashboard();
}

function quickAddMass() {
    // Show mass entry view with today's date pre-selected
    document.getElementById('nav-mass-entry').click();
    
    const today = new Date();
    document.getElementById('mass-year').value = today.getFullYear();
    document.getElementById('mass-month').value = today.getMonth();
    document.getElementById('mass-day').value = today.getDate();
    
    // Trigger date change to load data
    const event = new Event('change');
    document.getElementById('mass-day').dispatchEvent(event);
}

function quickViewReport() {
    // Show reports view with current month pre-selected
    document.getElementById('nav-reports').click();
    
    const today = new Date();
    document.getElementById('report-year').value = today.getFullYear();
    document.getElementById('report-month').value = today.getMonth();
    
    // Generate report
    generateMonthlyReport();
}

// Mass Entry functions
async function initMassEntry() {
    // Populate dropdowns
    populateDropdown('mass-year', 2020, 2030);
    populateDropdown('mass-month', 0, 11, true);
    populateDropdown('mass-day', 1, 31);
    
    // Set current date
    const currentDate = new Date();
    document.getElementById('mass-year').value = currentDate.getFullYear();
    document.getElementById('mass-month').value = currentDate.getMonth();
    document.getElementById('mass-day').value = currentDate.getDate();
    
    // Set up event listeners
    document.getElementById('mass-year').addEventListener('change', updateMassEntryDate);
    document.getElementById('mass-month').addEventListener('change', updateMassEntryDate);
    document.getElementById('mass-day').addEventListener('change', updateMassEntryDate);
    document.getElementById('mass-entry-form').addEventListener('submit', saveMassEntry);
    document.getElementById('cancel-mass-entry').addEventListener('click', cancelMassEntry);
    document.getElementById('mass-status-celebrated').addEventListener('change', toggleMissedReason);
    document.getElementById('mass-status-missed').addEventListener('change', toggleMissedReason);
    document.getElementById('mass-entry-prev-month').addEventListener('click', massEntryPrevMonth);
    document.getElementById('mass-entry-next-month').addEventListener('click', massEntryNextMonth);
    
    // Initialize mass entry calendar
    await updateMassEntryCalendar();
}

async function updateMassEntryDate() {
    const year = parseInt(document.getElementById('mass-year').value);
    const month = parseInt(document.getElementById('mass-month').value);
    const day = parseInt(document.getElementById('mass-day').value);
    
    const dateStr = formatDate(new Date(year, month, day));
    
    try {
        const mass = await getData('masses', dateStr);
        const settings = await getData('settings', 'currentSettings');
        
        // Populate form with existing data or defaults
        document.getElementById('mass-serial').value = mass ? mass.serial : settings.currentSerial;
        document.getElementById('mass-receipt-date').value = mass ? mass.receiptDate : '';
        document.getElementById('mass-from').value = mass ? mass.from : '';
        document.getElementById('mass-purpose').value = mass ? mass.purpose : '';
        document.getElementById('mass-remarks').value = mass ? mass.remarks : '';
        
        if (mass) {
            document.getElementById(`mass-status-${mass.status}`).checked = true;
            if (mass.status === 'missed') {
                document.getElementById('mass-missed-reason').value = mass.missedReason || 'other';
            }
        } else {
            document.getElementById('mass-status-celebrated').checked = true;
            document.getElementById('mass-missed-reason').value = 'illness';
        }
        
        toggleMissedReason();
    } catch (error) {
        console.error('Error loading mass data:', error);
    }
}

async function saveMassEntry(e) {
    e.preventDefault();
    
    try {
        const year = parseInt(document.getElementById('mass-year').value);
        const month = parseInt(document.getElementById('mass-month').value);
        const day = parseInt(document.getElementById('mass-day').value);
        const dateStr = formatDate(new Date(year, month, day));
        
        const settings = await getData('settings', 'currentSettings');
        
        // Check for Good Friday
        if (settings.goodFridays.includes(dateStr)) {
            alert('Cannot add mass for Good Friday');
            return;
        }
        
        // Check if mass already exists for this date
        const existingMass = await getData('masses', dateStr);
        if (existingMass && !confirm(`Mass already exists for ${formatDateDisplay(dateStr)}. Override?`)) {
            return;
        }
        
        // Get form data
        const massData = {
            date: dateStr,
            serial: parseInt(document.getElementById('mass-serial').value) || 0,
            receiptDate: document.getElementById('mass-receipt-date').value,
            from: document.getElementById('mass-from').value,
            purpose: document.getElementById('mass-purpose').value,
            remarks: document.getElementById('mass-remarks').value,
            status: document.querySelector('input[name="mass-status"]:checked').value,
            missedReason: document.getElementById('mass-missed-reason').value
        };
        
        // Update serial number if mass was celebrated
        if (massData.status === 'celebrated' && massData.serial > 0) {
            settings.currentSerial = massData.serial - 1;
            await saveData('settings', settings);
        }
        
        // Save mass data
        await saveData('masses', massData);
        
        // Update dashboard if on dashboard view
        if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
            await updateDashboard();
        }
        
        // Show success message
        alert('Mass data saved successfully');
        
    } catch (error) {
        console.error('Error saving mass:', error);
        alert('Failed to save mass data');
    }
}

function cancelMassEntry() {
    document.getElementById('mass-entry-form').reset();
    document.getElementById('nav-dashboard').click();
}

function toggleMissedReason() {
    const isMissed = document.getElementById('mass-status-missed').checked;
    document.getElementById('missed-reason-container').classList.toggle('hidden', !isMissed);
}

async function showMassEntry(dateStr) {
    document.getElementById('nav-mass-entry').click();
    
    const date = new Date(dateStr);
    document.getElementById('mass-year').value = date.getFullYear();
    document.getElementById('mass-month').value = date.getMonth();
    document.getElementById('mass-day').value = date.getDate();
    
    // Trigger date change to load data
    const event = new Event('change');
    document.getElementById('mass-day').dispatchEvent(event);
}

async function updateMassEntryCalendar() {
    const year = parseInt(document.getElementById('mass-year').value);
    const month = parseInt(document.getElementById('mass-month').value);
    
    // Update current month-year display
    document.getElementById('mass-entry-current-month-year').textContent = `${getMonthName(month)} ${year}`;
    
    // Generate calendar
    await generateMassEntryCalendar('mass-entry-calendar', year, month);
}

async function generateMassEntryCalendar(containerId, year, month) {
    const container = document.getElementById(containerId);
    const settings = await getData('settings', 'currentSettings');
    const allMasses = await getAllData('masses');
    
    // Create calendar table
    let calendarHTML = `<table class="calendar w-full">
        <thead>
            <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Stop if we've rendered all days
        if (date > daysInMonth) break;
        
        calendarHTML += '<tr>';
        
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                // Empty cells before first day of month
                calendarHTML += '<td></td>';
            } else if (date > daysInMonth) {
                // Empty cells after last day of month
                calendarHTML += '<td></td>';
            } else {
                // Cell with date
                const currentDate = new Date(year, month, date);
                const dateStr = formatDate(currentDate);
                const isToday = isCurrentMonth && date === today.getDate();
                
                // Check if date has any masses
                const massData = allMasses.find(m => m.date === dateStr);
                const isGoodFriday = settings.goodFridays.includes(dateStr);
                
                let dayClass = 'cursor-pointer hover:bg-gray-50';
                let onClick = `showMassEntry('${dateStr}')`;
                
                if (isGoodFriday) {
                    dayClass = 'bg-red-100 cursor-not-allowed';
                    onClick = '';
                }
                
                calendarHTML += `
                    <td onclick="${onClick}" class="${dayClass}">
                        <div class="calendar-day ${isToday ? 'today' : ''}">${date}</div>
                        ${massData ? `<div class="calendar-event">${massData.status === 'celebrated' ? 'Celebrated' : 'Missed'}</div>` : ''}
                        ${isGoodFriday ? '<div class="calendar-event good-friday">Good Friday</div>' : ''}
                    </td>`;
                date++;
            }
        }
        
        calendarHTML += '</tr>';
    }
    
    calendarHTML += '</tbody></table>';
    container.innerHTML = calendarHTML;
}

async function massEntryPrevMonth() {
    const monthSelect = document.getElementById('mass-month');
    const yearSelect = document.getElementById('mass-year');
    
    let month = parseInt(monthSelect.value);
    let year = parseInt(yearSelect.value);
    
    if (month === 0) {
        month = 11;
        year--;
    } else {
        month--;
    }
    
    monthSelect.value = month;
    yearSelect.value = year;
    await updateMassEntryCalendar();
}

async function massEntryNextMonth() {
    const monthSelect = document.getElementById('mass-month');
    const yearSelect = document.getElementById('mass-year');
    
    let month = parseInt(monthSelect.value);
    let year = parseInt(yearSelect.value);
    
    if (month === 11) {
        month = 0;
        year++;
    } else {
        month++;
    }
    
    monthSelect.value = month;
    yearSelect.value = year;
    await updateMassEntryCalendar();
}

// Personal Intentions functions
async function initPersonalIntentions() {
    // Populate year dropdown
    populateDropdown('pi-year', 2020, 2030);
    
    // Set current year
    const currentDate = new Date();
    document.getElementById('pi-year').value = currentDate.getFullYear();
    
    // Set up event listeners
    document.getElementById('pi-year').addEventListener('change', updatePersonalIntentions);
    document.getElementById('generate-random-intentions').addEventListener('click', generateRandomIntentions);
    
    // Update view
    await updatePersonalIntentions();
}

async function updatePersonalIntentions() {
    const year = parseInt(document.getElementById('pi-year').value);
    
    // Update fixed intentions table
    await updateFixedIntentionsTable(year);
    
    // Update random intentions table
    await updateRandomIntentionsTable(year);
}

async function updateFixedIntentionsTable(year) {
    const settings = await getData('settings', 'currentSettings');
    const allMasses = await getAllData('masses');
    const tableBody = document.getElementById('fixed-intentions-table');
    tableBody.innerHTML = '';
    
    settings.fixedIntentions.forEach(intention => {
        const dateStr = `${year}-${intention.month < 9 ? `0${intention.month + 1}` : intention.month + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
        const massData = allMasses.find(m => m.date === dateStr);
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${intention.day} ${getMonthName(intention.month)}</td>
            <td class="py-2 px-4 border">${intention.occasion}</td>
            <td class="py-2 px-4 border">
                <span class="status-badge ${massData && massData.status === 'celebrated' ? 'completed' : 'pending'}">
                    ${massData && massData.status === 'celebrated' ? 'Celebrated' : 'Pending'}
                </span>
            </td>
            <td class="py-2 px-4 border">
                <button onclick="editFixedIntention('${dateStr}')" class="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm">
                    <i class="fas fa-edit mr-1"></i>Edit
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function updateRandomIntentionsTable(year) {
    const allMasses = await getAllData('masses');
    const personalIntentions = await getAllData('personalIntentions');
    const tableBody = document.getElementById('random-intentions-table');
    tableBody.innerHTML = '';
    
    // Months without fixed intentions: April (3), June (5), July (6), August (7), October (9)
    const monthsWithoutFixed = [3, 5, 6, 7, 9];
    
    for (const month of monthsWithoutFixed) {
        // Get or generate random dates for this month and year
        let yearMonthData = personalIntentions.find(pi => pi.year === year && pi.month === month);
        
        if (!yearMonthData) {
            // Generate 3 random dates for this month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dates = [];
            
            // Generate 3 unique random dates
            while (dates.length < 3) {
                const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
                if (!dates.includes(randomDay)) {
                    dates.push(randomDay);
                }
            }
            
            dates.sort((a, b) => a - b);
            yearMonthData = { id: `${year}-${month}`, year, month, dates };
            await saveData('personalIntentions', yearMonthData);
        }
        
        const monthName = getMonthName(month);
        
        // Count celebrated masses for these dates
        let celebratedCount = 0;
        
        for (const day of yearMonthData.dates) {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
            if (allMasses.some(m => m.date === dateStr && m.status === 'celebrated')) {
                celebratedCount++;
            }
        }
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${monthName}</td>
            <td class="py-2 px-4 border">${yearMonthData.dates[0]}</td>
            <td class="py-2 px-4 border">${yearMonthData.dates[1]}</td>
            <td class="py-2 px-4 border">${yearMonthData.dates[2]}</td>
            <td class="py-2 px-4 border">
                <span class="status-badge ${celebratedCount === 3 ? 'completed' : 'pending'}">
                    ${celebratedCount}/3
                </span>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
}

async function generateRandomIntentions() {
    const year = parseInt(document.getElementById('pi-year').value);
    const personalIntentions = await getAllData('personalIntentions');
    
    // Months without fixed intentions: April (3), June (5), July (6), August (7), October (9)
    const monthsWithoutFixed = [3, 5, 6, 7, 9];
    
    for (const month of monthsWithoutFixed) {
        // Generate 3 random dates for this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dates = [];
        
        // Generate 3 unique random dates
        while (dates.length < 3) {
            const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
            if (!dates.includes(randomDay)) {
                dates.push(randomDay);
            }
        }
        
        dates.sort((a, b) => a - b);
        
        // Save or update the personal intentions
        const existingIndex = personalIntentions.findIndex(pi => pi.year === year && pi.month === month);
        
        if (existingIndex >= 0) {
            personalIntentions[existingIndex].dates = dates;
            await saveData('personalIntentions', personalIntentions[existingIndex]);
        } else {
            await saveData('personalIntentions', { id: `${year}-${month}`, year, month, dates });
        }
    }
    
    await updateRandomIntentionsTable(year);
    alert('Random personal intentions generated for the selected year');
}

async function checkPersonalIntention(day, month, year) {
    const settings = await getData('settings', 'currentSettings');
    const personalIntentions = await getAllData('personalIntentions');
    
    // Check fixed intentions
    const fixedIntention = settings.fixedIntentions.find(i => 
        i.day === day && i.month === month
    );
    
    if (fixedIntention) return true;
    
    // Check random intentions
    const yearMonthData = personalIntentions.find(pi => pi.year === year && pi.month === month);
    if (yearMonthData) {
        return yearMonthData.dates.includes(day);
    }
    
    return false;
}

async function getPersonalIntentionOccasion(day, month, year) {
    const settings = await getData('settings', 'currentSettings');
    
    // Check fixed intentions
    const fixedIntention = settings.fixedIntentions.find(i => 
        i.day === day && i.month === month
    );
    
    if (fixedIntention) return fixedIntention.occasion;
    
    return "Personal Intention";
}

// Deceased Suffrages functions
async function initSuffrages() {
    // Set up event listeners
    document.getElementById('add-suffrage-btn').addEventListener('click', showAddSuffrageModal);
    document.getElementById('close-suffrage-modal').addEventListener('click', hideAddSuffrageModal);
    document.getElementById('cancel-suffrage').addEventListener('click', hideAddSuffrageModal);
    document.getElementById('suffrage-form').addEventListener('submit', saveSuffrage);
    document.getElementById('suffrage-filter').addEventListener('change', updateSuffragesTable);
    
    // Update view
    await updateSuffragesTable();
}

async function updateSuffragesTable() {
    const filter = document.getElementById('suffrage-filter').value;
    const allSuffrages = await getAllData('suffrages');
    const tableBody = document.getElementById('suffrages-table');
    tableBody.innerHTML = '';
    
    let suffrages = [...allSuffrages];
    
    // Apply filter
    if (filter === 'pending') {
        suffrages = suffrages.filter(s => !s.whenCelebrated);
    } else if (filter === 'completed') {
        suffrages = suffrages.filter(s => s.whenCelebrated);
    }
    
    // Sort by date of death (newest first)
    suffrages.sort((a, b) => new Date(b.deathDate) - new Date(a.deathDate));
    
    suffrages.forEach(suffrage => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${formatDateDisplay(suffrage.deathDate)}</td>
            <td class="py-2 px-4 border">${suffrage.name}</td>
            <td class="py-2 px-4 border">${suffrage.whenCelebrated ? formatDateDisplay(suffrage.whenCelebrated) : 'Pending'}</td>
            <td class="py-2 px-4 border">
                <span class="status-badge ${suffrage.whenCelebrated ? 'completed' : 'pending'}">
                    ${suffrage.whenCelebrated ? 'Completed' : 'Pending'}
                </span>
            </td>
            <td class="py-2 px-4 border">
                <button onclick="editSuffrage('${suffrage.id}')" class="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm mr-1">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteSuffrage('${suffrage.id}')" class="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function showAddSuffrageModal() {
    // Reset form
    document.getElementById('suffrage-form').reset();
    document.getElementById('suffrage-id').value = '';
    
    // Set default dates
    const today = formatDateForInput(new Date());
    document.getElementById('suffrage-death-date').value = today;
    document.getElementById('suffrage-receipt-date').value = today;
    
    // Show modal
    document.getElementById('suffrage-modal').classList.remove('hidden');
}

function hideAddSuffrageModal() {
    document.getElementById('suffrage-modal').classList.add('hidden');
}

async function saveSuffrage(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('suffrage-id').value || Date.now().toString();
        
        const suffrageData = {
            id,
            name: document.getElementById('suffrage-name').value,
            deathDate: document.getElementById('suffrage-death-date').value,
            receiptDate: document.getElementById('suffrage-receipt-date').value,
            whenCelebrated: document.getElementById('suffrage-celebrated-date').value || null
        };
        
        // Save the suffrage
        await saveData('suffrages', suffrageData);
        
        // Update the table
        await updateSuffragesTable();
        
        // Hide the modal
        hideAddSuffrageModal();
        
        // Update dashboard if needed
        if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
            await updateDashboard();
        }
        
        alert('Suffrage saved successfully');
    } catch (error) {
        console.error('Error saving suffrage:', error);
        alert('Failed to save suffrage');
    }
}

async function editSuffrage(id) {
    try {
        const suffrage = await getData('suffrages', id);
        
        if (!suffrage) return;
        
        // Populate form
        document.getElementById('suffrage-id').value = suffrage.id;
        document.getElementById('suffrage-name').value = suffrage.name;
        document.getElementById('suffrage-death-date').value = suffrage.deathDate;
        document.getElementById('suffrage-receipt-date').value = suffrage.receiptDate;
        document.getElementById('suffrage-celebrated-date').value = suffrage.whenCelebrated || '';
        
        // Show modal
        document.getElementById('suffrage-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error editing suffrage:', error);
        alert('Failed to load suffrage data');
    }
}

async function deleteSuffrage(id) {
    if (!confirm('Are you sure you want to delete this suffrage?')) return;
    
    try {
        await deleteData('suffrages', id);
        await updateSuffragesTable();
        alert('Suffrage deleted successfully');
    } catch (error) {
        console.error('Error deleting suffrage:', error);
        alert('Failed to delete suffrage');
    }
}

// Mass Receptions functions
async function initMassReceptions() {
    // Set up event listeners
    document.getElementById('add-reception-btn').addEventListener('click', showAddReceptionModal);
    document.getElementById('close-reception-modal').addEventListener('click', hideAddReceptionModal);
    document.getElementById('cancel-reception').addEventListener('click', hideAddReceptionModal);
    document.getElementById('reception-form').addEventListener('submit', saveReception);
    document.getElementById('reception-year-filter').addEventListener('change', updateReceptionsTable);
    
    // Populate year filter
    populateDropdown('reception-year-filter', 2020, 2030);
    document.getElementById('reception-year-filter').value = 'all';
    
    // Update view
    await updateReceptionsTable();
}

async function updateReceptionsTable() {
    const yearFilter = document.getElementById('reception-year-filter').value;
    const allReceptions = await getAllData('receptions');
    const tableBody = document.getElementById('receptions-table');
    tableBody.innerHTML = '';
    
    let receptions = [...allReceptions];
    
    // Apply filter
    if (yearFilter !== 'all') {
        receptions = receptions.filter(r => r.date.startsWith(yearFilter));
    }
    
    // Sort by date (newest first)
    receptions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    receptions.forEach(reception => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${formatDateDisplay(reception.date)}</td>
            <td class="py-2 px-4 border">${reception.from}</td>
            <td class="py-2 px-4 border">${reception.purpose || ''}</td>
            <td class="py-2 px-4 border">${reception.amount}</td>
            <td class="py-2 px-4 border">
                <button onclick="editReception('${reception.id}')" class="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm mr-1">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteReception('${reception.id}')" class="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function showAddReceptionModal() {
    // Reset form
    document.getElementById('reception-form').reset();
    document.getElementById('reception-id').value = '';
    
    // Set default date to today
    document.getElementById('reception-date').value = formatDateForInput(new Date());
    
    // Show modal
    document.getElementById('reception-modal').classList.remove('hidden');
}

function hideAddReceptionModal() {
    document.getElementById('reception-modal').classList.add('hidden');
}

async function saveReception(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('reception-id').value || Date.now().toString();
        
        const receptionData = {
            id,
            date: document.getElementById('reception-date').value,
            from: document.getElementById('reception-from').value,
            purpose: document.getElementById('reception-purpose').value,
            amount: parseInt(document.getElementById('reception-amount').value)
        };
        
        // Get current settings
        const settings = await getData('settings', 'currentSettings');
        
        // If this is a new reception, update the serial number
        if (!document.getElementById('reception-id').value) {
            settings.currentSerial += receptionData.amount;
            await saveData('settings', settings);
        }
        
        // Save the reception
        await saveData('receptions', receptionData);
        
        // Update the table
        await updateReceptionsTable();
        
        // Hide the modal
        hideAddReceptionModal();
        
        // Update dashboard if needed
        if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
            await updateDashboard();
        }
        
        alert('Mass reception saved successfully');
    } catch (error) {
        console.error('Error saving reception:', error);
        alert('Failed to save mass reception');
    }
}

async function editReception(id) {
    try {
        const reception = await getData('receptions', id);
        
        if (!reception) return;
        
        // Populate form
        document.getElementById('reception-id').value = reception.id;
        document.getElementById('reception-date').value = reception.date;
        document.getElementById('reception-from').value = reception.from;
        document.getElementById('reception-purpose').value = reception.purpose || '';
        document.getElementById('reception-amount').value = reception.amount;
        
        // Show modal
        document.getElementById('reception-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error editing reception:', error);
        alert('Failed to load reception data');
    }
}

async function deleteReception(id) {
    if (!confirm('Are you sure you want to delete this reception?')) return;
    
    try {
        await deleteData('receptions', id);
        await updateReceptionsTable();
        alert('Reception deleted successfully');
    } catch (error) {
        console.error('Error deleting reception:', error);
        alert('Failed to delete reception');
    }
}

// Reports functions
async function initReports() {
    // Populate dropdowns
    populateDropdown('report-year', 2020, 2030);
    populateDropdown('report-month', 0, 11, true);
    populateDropdown('report-yearly-year', 2020, 2030);
    
    // Set current date
    const currentDate = new Date();
    document.getElementById('report-year').value = currentDate.getFullYear();
    document.getElementById('report-month').value = currentDate.getMonth();
    document.getElementById('report-yearly-year').value = currentDate.getFullYear();
    
    // Set up event listeners
    document.getElementById('generate-monthly-report').addEventListener('click', generateMonthlyReport);
    document.getElementById('generate-yearly-report').addEventListener('click', generateYearlyReport);
    document.getElementById('export-excel').addEventListener('click', exportToExcel);
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('import-data').addEventListener('click', showImportModal);
    document.getElementById('print-report').addEventListener('click', printReport);
}

async function generateMonthlyReport() {
    const year = parseInt(document.getElementById('report-year').value);
    const month = parseInt(document.getElementById('report-month').value);
    
    try {
        const allMasses = await getAllData('masses');
        const allSuffrages = await getAllData('suffrages');
        const settings = await getData('settings', 'currentSettings');
        const personalIntentions = await getAllData('personalIntentions');
        
        const monthStr = month < 9 ? `0${month + 1}` : month + 1;
        const monthPrefix = `${year}-${monthStr}`;
        const monthName = getMonthName(month);
        
        // Filter masses for this month
        const monthMasses = allMasses
            .filter(mass => mass.date.startsWith(monthPrefix))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate stats
        let celebrated = 0;
        let missed = 0;
        let personalCelebrated = 0;
        let suffragesCelebrated = 0;
        
        monthMasses.forEach(mass => {
            if (mass.status === 'celebrated') {
                celebrated++;
            } else {
                missed++;
            }
        });
        
        // Check suffrages for this month
        const monthSuffrages = allSuffrages.filter(s => 
            s.whenCelebrated && s.whenCelebrated.startsWith(monthPrefix)
        );
        suffragesCelebrated = monthSuffrages.length;
        
        // Check personal intentions fulfillment
        const personalFulfilled = await checkPersonalIntentionsFulfilled(year, month);
        
        // Generate report HTML
        let reportHTML = `
            <h4 class="text-lg font-semibold mb-4">Monthly Report for ${monthName} ${year}</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-blue-50 p-3 rounded border border-blue-200">
                    <h5 class="font-medium text-blue-800 mb-2">Mass Celebrations</h5>
                    <p>Total Masses Celebrated: <span class="font-bold">${celebrated}</span></p>
                    <p>Masses Missed: <span class="font-bold">${missed}</span></p>
                </div>
                
                <div class="bg-purple-50 p-3 rounded border border-purple-200">
                    <h5 class="font-medium text-purple-800 mb-2">Personal Intentions</h5>
                    <p>Personal Masses Celebrated: <span class="font-bold">${personalFulfilled.count}/3</span></p>
                    <p>Status: <span class="font-bold ${personalFulfilled.fulfilled ? 'text-green-600' : 'text-red-600'}">${personalFulfilled.fulfilled ? 'Fulfilled' : 'Not Fulfilled'}</span></p>
                </div>
                
                <div class="bg-green-50 p-3 rounded border border-green-200">
                    <h5 class="font-medium text-green-800 mb-2">Deceased Suffrages</h5>
                    <p>Suffrages Celebrated: <span class="font-bold">${suffragesCelebrated}</span></p>
                </div>
                
                <div class="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h5 class="font-medium text-yellow-800 mb-2">Intentions</h5>
                    <p>Current Serial Number: <span class="font-bold">${settings.currentSerial}</span></p>
                </div>
            </div>
            
            <h5 class="font-medium mb-2">Mass Celebrations Details</h5>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border mb-6">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-2 px-4 border">Date</th>
                            <th class="py-2 px-4 border">Serial No.</th>
                            <th class="py-2 px-4 border">Intention</th>
                            <th class="py-2 px-4 border">From Whom</th>
                            <th class="py-2 px-4 border">Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        for (const mass of monthMasses) {
            const isPersonal = await checkPersonalIntention(
                new Date(mass.date).getDate(),
                new Date(mass.date).getMonth(),
                new Date(mass.date).getFullYear()
            );
            
            reportHTML += `
                <tr class="${mass.status === 'celebrated' ? 'bg-blue-50' : 'bg-red-50'}">
                    <td class="py-2 px-4 border">${formatDateDisplay(mass.date)}</td>
                    <td class="py-2 px-4 border">${mass.serial || ''}</td>
                    <td class="py-2 px-4 border">${mass.purpose || ''} ${isPersonal ? '(Personal)' : ''}</td>
                    <td class="py-2 px-4 border">${mass.from || ''}</td>
                    <td class="py-2 px-4 border">
                        <span class="status-badge ${mass.status === 'celebrated' ? 'completed' : 'missed'}">
                            ${mass.status === 'celebrated' ? 'Celebrated' : 'Missed'}
                        </span>
                    </td>
                </tr>`;
        }
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
            
            <h5 class="font-medium mb-2">Personal Intentions Details</h5>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border mb-6">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-2 px-4 border">Date</th>
                            <th class="py-2 px-4 border">Occasion</th>
                            <th class="py-2 px-4 border">Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        // Add fixed intentions
        for (const intention of settings.fixedIntentions) {
            if (intention.month === month) {
                const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
                const mass = allMasses.find(m => m.date === dateStr);
                const celebrated = mass && mass.status === 'celebrated';
                
                reportHTML += `
                    <tr class="${celebrated ? 'bg-green-50' : 'bg-yellow-50'}">
                        <td class="py-2 px-4 border">${formatDateDisplay(dateStr)}</td>
                        <td class="py-2 px-4 border">${intention.occasion}</td>
                        <td class="py-2 px-4 border">
                            <span class="status-badge ${celebrated ? 'completed' : 'pending'}">
                                ${celebrated ? 'Celebrated' : 'Pending'}
                            </span>
                        </td>
                    </tr>`;
            }
        }
        
        // Add random intentions
        const yearMonthData = personalIntentions.find(pi => pi.year === year && pi.month === month);
        if (yearMonthData) {
            for (const day of yearMonthData.dates) {
                const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
                const mass = allMasses.find(m => m.date === dateStr);
                const celebrated = mass && mass.status === 'celebrated';
                
                reportHTML += `
                    <tr class="${celebrated ? 'bg-green-50' : 'bg-yellow-50'}">
                        <td class="py-2 px-4 border">${formatDateDisplay(dateStr)}</td>
                        <td class="py-2 px-4 border">Personal Intention</td>
                        <td class="py-2 px-4 border">
                            <span class="status-badge ${celebrated ? 'completed' : 'pending'}">
                                ${celebrated ? 'Celebrated' : 'Pending'}
                            </span>
                        </td>
                    </tr>`;
            }
        }
        
        reportHTML += `
                    </tbody>
                </table>
            </div>`;
        
        // Display report
        document.getElementById('report-title').textContent = `Monthly Report - ${monthName} ${year}`;
        document.getElementById('report-content').innerHTML = reportHTML;
        document.getElementById('report-display').classList.remove('hidden');
    } catch (error) {
        console.error('Error generating monthly report:', error);
        alert('Failed to generate monthly report');
    }
}

async function generateYearlyReport() {
    const year = parseInt(document.getElementById('report-yearly-year').value);
    
    try {
        const allMasses = await getAllData('masses');
        const allSuffrages = await getAllData('suffrages');
        const settings = await getData('settings', 'currentSettings');
        const personalIntentions = await getAllData('personalIntentions');
        
        // Filter masses for this year
        const yearMasses = allMasses
            .filter(mass => mass.date.startsWith(year.toString()))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate stats
        let celebrated = 0;
        let missed = 0;
        let suffragesCelebrated = 0;
        
        yearMasses.forEach(mass => {
            if (mass.status === 'celebrated') {
                celebrated++;
            } else {
                missed++;
            }
        });
        
        // Check suffrages for this year
        const yearSuffrages = allSuffrages.filter(s => 
            s.whenCelebrated && s.whenCelebrated.startsWith(year.toString())
        );
        suffragesCelebrated = yearSuffrages.length;
        
        // Calculate personal intentions fulfillment by month
        const monthlyPersonal = [];
        for (let month = 0; month < 12; month++) {
            const result = await checkPersonalIntentionsFulfilled(year, month);
            monthlyPersonal.push(result.count);
        }
        
        // Generate report HTML
        let reportHTML = `
            <h4 class="text-lg font-semibold mb-4">Yearly Report for ${year}</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-blue-50 p-3 rounded border border-blue-200">
                    <h5 class="font-medium text-blue-800 mb-2">Mass Celebrations</h5>
                    <p>Total Masses Celebrated: <span class="font-bold">${celebrated}</span></p>
                    <p>Masses Missed: <span class="font-bold">${missed}</span></p>
                </div>
                
                <div class="bg-purple-50 p-3 rounded border border-purple-200">
                    <h5 class="font-medium text-purple-800 mb-2">Personal Intentions</h5>
                    <p>Total Personal Masses Celebrated: <span class="font-bold">${monthlyPersonal.reduce((a, b) => a + b, 0)}</span></p>
                    <p>Average per Month: <span class="font-bold">${(monthlyPersonal.reduce((a, b) => a + b, 0) / 12).toFixed(1)}</span></p>
                </div>
                
                <div class="bg-green-50 p-3 rounded border border-green-200">
                    <h5 class="font-medium text-green-800 mb-2">Deceased Suffrages</h5>
                    <p>Suffrages Celebrated: <span class="font-bold">${suffragesCelebrated}</span></p>
                    <p>Pending Suffrages: <span class="font-bold">${allSuffrages.filter(s => !s.whenCelebrated).length}</span></p>
                </div>
                
                <div class="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h5 class="font-medium text-yellow-800 mb-2">Intentions</h5>
                    <p>Current Serial Number: <span class="font-bold">${settings.currentSerial}</span></p>
                </div>
            </div>
            
            <h5 class="font-medium mb-2">Monthly Breakdown</h5>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border mb-6">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-2 px-4 border">Month</th>
                            <th class="py-2 px-4 border">Masses Celebrated</th>
                            <th class="py-2 px-4 border">Masses Missed</th>
                            <th class="py-2 px-4 border">Personal Intentions</th>
                            <th class="py-2 px-4 border">Suffrages</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        for (let month = 0; month < 12; month++) {
            const monthStr = month < 9 ? `0${month + 1}` : month + 1;
            const monthPrefix = `${year}-${monthStr}`;
            
            // Filter masses for this month
            const monthMasses = yearMasses.filter(m => m.date.startsWith(monthPrefix));
            const monthCelebrated = monthMasses.filter(m => m.status === 'celebrated').length;
            const monthMissed = monthMasses.filter(m => m.status === 'missed').length;
            
            // Filter suffrages for this month
            const monthSuffrages = yearSuffrages.filter(s => s.whenCelebrated.startsWith(monthPrefix)).length;
            
            reportHTML += `
                <tr>
                    <td class="py-2 px-4 border">${getMonthName(month)}</td>
                    <td class="py-2 px-4 border">${monthCelebrated}</td>
                    <td class="py-2 px-4 border">${monthMissed}</td>
                    <td class="py-2 px-4 border ${monthlyPersonal[month] >= 3 ? 'text-green-600' : 'text-red-600'}">
                        ${monthlyPersonal[month]}/3
                    </td>
                    <td class="py-2 px-4 border">${monthSuffrages}</td>
                </tr>`;
        }
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
            
            <h5 class="font-medium mb-2">Pending Suffrages</h5>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-2 px-4 border">Date of Death</th>
                            <th class="py-2 px-4 border">Name</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        const pendingSuffrages = allSuffrages.filter(s => !s.whenCelebrated);
        
        if (pendingSuffrages.length > 0) {
            for (const suffrage of pendingSuffrages) {
                reportHTML += `
                    <tr>
                        <td class="py-2 px-4 border">${formatDateDisplay(suffrage.deathDate)}</td>
                        <td class="py-2 px-4 border">${suffrage.name}</td>
                    </tr>`;
            }
        } else {
            reportHTML += `
                <tr>
                    <td colspan="2" class="py-2 px-4 border text-center">No pending suffrages</td>
                </tr>`;
        }
        
        reportHTML += `
                    </tbody>
                </table>
            </div>`;
        
        // Display report
        document.getElementById('report-title').textContent = `Yearly Report - ${year}`;
        document.getElementById('report-content').innerHTML = reportHTML;
        document.getElementById('report-display').classList.remove('hidden');
    } catch (error) {
        console.error('Error generating yearly report:', error);
        alert('Failed to generate yearly report');
    }
}

async function checkPersonalIntentionsFulfilled(year, month) {
    const allMasses = await getAllData('masses');
    const settings = await getData('settings', 'currentSettings');
    const personalIntentions = await getAllData('personalIntentions');
    
    let count = 0;
    
    // Check fixed intentions
    for (const intention of settings.fixedIntentions) {
        if (intention.month === month) {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
            if (allMasses.some(m => m.date === dateStr && m.status === 'celebrated')) {
                count++;
            }
        }
    }
    
    // Check random intentions
    const yearMonthData = personalIntentions.find(pi => pi.year === year && pi.month === month);
    if (yearMonthData) {
        for (const day of yearMonthData.dates) {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
            if (allMasses.some(m => m.date === dateStr && m.status === 'celebrated')) {
                count++;
            }
        }
    }
    
    return {
        count,
        fulfilled: count >= 3
    };
}

function exportToExcel() {
    // This would use a library like SheetJS in a real implementation
    alert('Excel export functionality would be implemented here');
    // In a real app, we would generate an Excel file with all the data
}

function exportToPDF() {
    // This would use a library like jsPDF in a real implementation
    alert('PDF export functionality would be implemented here');
    // In a real app, we would generate a PDF with the current report
}

function printReport() {
    window.print();
}

// Settings functions
async function initSettings() {
    // Set up event listeners
    document.getElementById('backup-data').addEventListener('click', backupData);
    document.getElementById('restore-data').addEventListener('click', triggerRestore);
    document.getElementById('restore-file').addEventListener('change', restoreData);
    document.getElementById('reset-data').addEventListener('click', resetData);
    document.getElementById('add-fixed-date').addEventListener('click', addFixedDate);
}

async function backupData() {
    try {
        const allMasses = await getAllData('masses');
        const allSuffrages = await getAllData('suffrages');
        const allReceptions = await getAllData('receptions');
        const allPersonalIntentions = await getAllData('personalIntentions');
        const settings = await getData('settings', 'currentSettings');
        
        const backupData = {
            masses: allMasses.reduce((acc, mass) => {
                acc[mass.date] = mass;
                return acc;
            }, {}),
            suffrages: allSuffrages,
            receptions: allReceptions,
            personalIntentions: allPersonalIntentions,
            settings: settings
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportName = `msfs-mass-tracker-backup-${formatDate(new Date())}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
        
        alert('Backup created successfully');
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Failed to create backup');
    }
}

function triggerRestore() {
    document.getElementById('restore-file').click();
}

async function restoreData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm('Are you sure you want to restore from backup? This will overwrite all current data.')) {
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Clear all existing data
                const stores = ['masses', 'suffrages', 'receptions', 'personalIntentions', 'settings'];
                for (const store of stores) {
                    const allData = await getAllData(store);
                    for (const item of allData) {
                        await deleteData(store, item.date || item.id);
                    }
                }
                
                // Restore masses
                for (const date in data.masses) {
                    await saveData('masses', data.masses[date]);
                }
                
                // Restore suffrages
                for (const suffrage of data.suffrages) {
                    await saveData('suffrages', suffrage);
                }
                
                // Restore receptions
                for (const reception of data.receptions) {
                    await saveData('receptions', reception);
                }
                
                // Restore personal intentions
                for (const pi of data.personalIntentions) {
                    await saveData('personalIntentions', pi);
                }
                
                // Restore settings
                await saveData('settings', data.settings);
                
                alert('Data restored successfully');
                location.reload(); // Refresh to show restored data
            } catch (error) {
                console.error('Error parsing backup:', error);
                alert('Error restoring data: Invalid backup file');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error restoring data:', error);
        alert('Failed to restore data');
    }
}

async function resetData() {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        return;
    }
    
    try {
        // Clear all existing data
        const stores = ['masses', 'suffrages', 'receptions', 'personalIntentions'];
        for (const store of stores) {
            const allData = await getAllData(store);
            for (const item of allData) {
                await deleteData(store, item.date || item.id);
            }
        }
        
        // Reset settings to defaults
        const defaultSettings = {
            id: 'currentSettings',
            currentSerial: 300,
            fixedIntentions: [
                { day: 18, month: 0, occasion: "Gladwin Birthday" },
                { day: 16, month: 1, occasion: "Dominic Birthday" },
                { day: 2, month: 2, occasion: "Paritosh Birthday" },
                { day: 4, month: 4, occasion: "Sophie Birthday" },
                { day: 7, month: 8, occasion: "Daddy Birthday" },
                { day: 17, month: 8, occasion: "Theodore Birthday" },
                { day: 23, month: 8, occasion: "Regina Birthday" },
                { day: 12, month: 10, occasion: "Anaya Birthday" },
                { day: 20, month: 10, occasion: "Carmel Birthday" },
                { day: 18, month: 11, occasion: "Mummy Death Anniversary" },
                { day: 27, month: 0, occasion: "Ordination Anniversary" },
                { day: 1, month: 6, occasion: "Eshban Birthday" },
                { day: 16, month: 7, occasion: "Sr Synthia Birthday" },
                { day: 27, month: 7, occasion: "Dada Death Anniversary" },
                { day: 1, month: 11, occasion: "Sr. Sherly Birthday" },
                { day: 20, month: 11, occasion: "Seeba Birthday" }
            ],
            goodFridays: ["2024-03-29", "2025-04-18", "2026-04-03"]
        };
        
        await saveData('settings', defaultSettings);
        
        alert('Data reset successfully');
        location.reload(); // Refresh to show clean state
    } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data');
    }
}

async function addFixedDate() {
    const day = parseInt(document.getElementById('new-fixed-day').value);
    const month = parseInt(document.getElementById('new-fixed-month').value);
    const occasion = document.getElementById('new-fixed-occasion').value.trim();
    
    if (!occasion) {
        alert('Please enter an occasion');
        return;
    }
    
    try {
        const settings = await getData('settings', 'currentSettings');
        
        // Check if this date already exists
        const exists = settings.fixedIntentions.some(i => 
            i.day === day && i.month === month
        );
        
        if (exists) {
            alert('This date already has a fixed intention');
            return;
        }
        
        // Add new fixed intention
        settings.fixedIntentions.push({
            day,
            month,
            occasion
        });
        
        await saveData('settings', settings);
        
        // Reset form
        document.getElementById('new-fixed-occasion').value = '';
        
        // Update view
        await updateFixedIntentionsTable(document.getElementById('pi-year').value);
        
        alert('Fixed date added successfully');
    } catch (error) {
        console.error('Error adding fixed date:', error);
        alert('Failed to add fixed date');
    }
}

// Import/Export functions
function showImportModal() {
    // Reset form
    document.getElementById('import-file').value = '';
    document.getElementById('import-type').value = 'masses';
    document.getElementById('import-overwrite').checked = false;
    
    // Show modal
    document.getElementById('import-modal').classList.remove('hidden');
}

function hideImportModal() {
    document.getElementById('import-modal').classList.add('hidden');
}

// Initial data loading
async function loadInitialData() {
    try {
        const allMasses = await getAllData('masses');
        const allSuffrages = await getAllData('suffrages');
        const allReceptions = await getAllData('receptions');
        
        // Load sample data if database is empty
        if (allMasses.length === 0 && allSuffrages.length === 0 && allReceptions.length === 0) {
            // Sample mass receptions
            const sampleReceptions = [
                { id: '1', date: '2020-12-22', from: 'NGP Province', purpose: 'General suffrages', amount: 300 },
                { id: '2', date: '2022-01-26', from: 'NGP Province', purpose: 'General suffrages', amount: 300 },
                { id: '3', date: '2022-06-05', from: 'Generalate', purpose: 'General suffrages', amount: 300 },
                { id: '4', date: '2023-08-23', from: 'NGP Province', purpose: 'General suffrages', amount: 300 }
            ];
            
            for (const reception of sampleReceptions) {
                await saveData('receptions', reception);
            }
            
            // Sample suffrages
            const sampleSuffrages = [
                { id: '1', name: 'Fr. Bernard Casso', deathDate: '2023-03-11', receiptDate: '2023-03-11', whenCelebrated: '2023-03-12' },
                { id: '2', name: 'Fr. Jose Puthiyaparambil', deathDate: '2024-05-02', receiptDate: '2024-05-02', whenCelebrated: '2024-05-03' }
            ];
            
            for (const suffrage of sampleSuffrages) {
                await saveData('suffrages', suffrage);
            }
            
            // Update settings with initial serial number
            const settings = await getData('settings', 'currentSettings');
            settings.currentSerial = 300;
            await saveData('settings', settings);
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Reminders
async function checkReminders() {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const result = await checkPersonalIntentionsFulfilled(currentYear, currentMonth);
        
        // Show reminder if less than 3 personal masses celebrated
        if (result.count < 3) {
            const remaining = 3 - result.count;
            const reminder = document.createElement('div');
            reminder.className = 'mb-2';
            reminder.innerHTML = `<i class="fas fa-bell mr-2"></i>Celebrate ${remaining} more personal mass${remaining > 1 ? 'es' : ''} this month`;
            
            document.getElementById('reminders-container').appendChild(reminder);
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

// Helper function for date input formatting
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Make functions available globally for HTML event handlers
window.showMassEntry = showMassEntry;
window.editFixedIntention = showMassEntry; // Reusing the same function
window.editSuffrage = editSuffrage;
window.deleteSuffrage = deleteSuffrage;
window.editReception = editReception;
window.deleteReception = deleteReception;
