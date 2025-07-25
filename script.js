document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

function initApp() {
    // Initialize database
    initDatabase();
    
    // Set up navigation
    setupNavigation();
    
    // Initialize dashboard
    initDashboard();
    
    // Initialize mass entry
    initMassEntry();
    
    // Initialize personal intentions
    initPersonalIntentions();
    
    // Initialize deceased suffrages
    initSuffrages();
    
    // Initialize mass receptions
    initMassReceptions();
    
    // Initialize reports
    initReports();
    
    // Initialize settings
    initSettings();
    
    // Load initial data
    loadInitialData();
    
    // Set up event listeners for modals
    setupModalListeners();
    
    // Check for reminders
    checkReminders();
}

// Database functions
function initDatabase() {
    // Check if database exists in localStorage, if not create it
    if (!localStorage.getItem('msfsMassTracker')) {
        const initialData = {
            masses: {},
            suffrages: [],
            receptions: [],
            personalIntentions: {},
            settings: {
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
                goodFridays: [
                    "2024-03-29",
                    "2025-04-18",
                    "2026-04-03"
                ],
                currentSerial: 0
            }
        };
        
        localStorage.setItem('msfsMassTracker', JSON.stringify(initialData));
    }
}

function getDatabase() {
    return JSON.parse(localStorage.getItem('msfsMassTracker'));
}

function updateDatabase(data) {
    localStorage.setItem('msfsMassTracker', JSON.stringify(data));
}

// Navigation functions
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
function initDashboard() {
    // Populate year and month dropdowns
    populateYearDropdown('dashboard-year', 2020, 2030);
    populateMonthDropdown('dashboard-month');
    
    // Set current month and year
    const currentDate = new Date();
    document.getElementById('dashboard-year').value = currentDate.getFullYear();
    document.getElementById('dashboard-month').value = currentDate.getMonth();
    
    // Set up event listeners
    document.getElementById('dashboard-year').addEventListener('change', updateDashboard);
    document.getElementById('dashboard-month').addEventListener('change', updateDashboard);
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    document.getElementById('quick-add-mass').addEventListener('click', quickAddMass);
    document.getElementById('quick-view-report').addEventListener('click', quickViewReport);
    
    // Update dashboard
    updateDashboard();
}

function updateDashboard() {
    const year = parseInt(document.getElementById('dashboard-year').value);
    const month = parseInt(document.getElementById('dashboard-month').value);
    
    // Update current month-year display
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month-year').textContent = `${monthNames[month]} ${year}`;
    
    // Generate calendar
    generateCalendar('calendar-container', year, month);
    
    // Update stats
    updateDashboardStats(year, month);
    
    // Update recent masses
    updateRecentMasses();
}

function generateCalendar(containerId, year, month) {
    const container = document.getElementById(containerId);
    const db = getDatabase();
    
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
                const massData = db.masses[dateStr] || null;
                const isGoodFriday = db.settings.goodFridays.includes(dateStr);
                const isSFSFeast = month === 0 && date === 24; // Jan 24
                
                // Check for personal intentions
                const isPersonalIntention = checkPersonalIntention(date, month, year);
                
                // Check for suffrages
                const suffrage = db.suffrages.find(s => s.whenCelebrated === dateStr);
                
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
                    const occasion = getPersonalIntentionOccasion(date, month, year);
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

function updateDashboardStats(year, month) {
    const db = getDatabase();
    const monthStr = month < 9 ? `0${month + 1}` : month + 1;
    const monthPrefix = `${year}-${monthStr}`;
    
    // Calculate stats
    let celebrated = 0;
    let missed = 0;
    let personal = 0;
    
    Object.keys(db.masses).forEach(dateStr => {
        if (dateStr.startsWith(monthPrefix)) {
            if (db.masses[dateStr].status === 'celebrated') {
                celebrated++;
                
                // Check if it's a personal intention
                const date = new Date(dateStr);
                if (checkPersonalIntention(date.getDate(), date.getMonth(), date.getFullYear())) {
                    personal++;
                }
            } else {
                missed++;
            }
        }
    });
    
    // Update DOM
    document.getElementById('stat-celebrated').textContent = celebrated;
    document.getElementById('stat-missed').textContent = missed;
    document.getElementById('stat-personal').textContent = `${personal}/3`;
    document.getElementById('stat-serial').textContent = db.settings.currentSerial;
}

function updateRecentMasses() {
    const db = getDatabase();
    const tableBody = document.getElementById('recent-masses-table');
    tableBody.innerHTML = '';
    
    // Get last 5 masses (celebrated or missed)
    const massDates = Object.keys(db.masses).sort().reverse().slice(0, 5);
    
    massDates.forEach(dateStr => {
        const mass = db.masses[dateStr];
        const date = new Date(dateStr);
        const dateFormatted = formatDateDisplay(dateStr);
        
        const row = document.createElement('tr');
        row.className = mass.status === 'celebrated' ? 'bg-blue-50' : 'bg-red-50';
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${dateFormatted}</td>
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

function prevMonth() {
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
    updateDashboard();
}

function nextMonth() {
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
    updateDashboard();
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
function initMassEntry() {
    // Populate dropdowns
    populateYearDropdown('mass-year', 2020, 2030);
    populateMonthDropdown('mass-month');
    populateDayDropdown('mass-day');
    
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
    updateMassEntryCalendar();
}

function updateMassEntryDate() {
    const year = parseInt(document.getElementById('mass-year').value);
    const month = parseInt(document.getElementById('mass-month').value);
    const day = parseInt(document.getElementById('mass-day').value);
    
    const dateStr = formatDate(new Date(year, month, day));
    const db = getDatabase();
    
    // Check if mass already exists for this date
    if (db.masses[dateStr]) {
        const mass = db.masses[dateStr];
        
        // Populate form with existing data
        document.getElementById('mass-serial').value = mass.serial || '';
        document.getElementById('mass-receipt-date').value = mass.receiptDate || '';
        document.getElementById('mass-from').value = mass.from || '';
        document.getElementById('mass-purpose').value = mass.purpose || '';
        document.getElementById('mass-remarks').value = mass.remarks || '';
        document.getElementById(`mass-status-${mass.status}`).checked = true;
        
        if (mass.status === 'missed') {
            document.getElementById('mass-missed-reason').value = mass.missedReason || 'other';
        }
        
        toggleMissedReason();
    } else {
        // Reset form for new entry
        document.getElementById('mass-serial').value = db.settings.currentSerial;
        document.getElementById('mass-receipt-date').value = '';
        document.getElementById('mass-from').value = '';
        document.getElementById('mass-purpose').value = '';
        document.getElementById('mass-remarks').value = '';
        document.getElementById('mass-status-celebrated').checked = true;
        document.getElementById('mass-missed-reason').value = 'illness';
        toggleMissedReason();
    }
}

function saveMassEntry(e) {
    e.preventDefault();
    
    const year = parseInt(document.getElementById('mass-year').value);
    const month = parseInt(document.getElementById('mass-month').value);
    const day = parseInt(document.getElementById('mass-day').value);
    const dateStr = formatDate(new Date(year, month, day));
    
    const db = getDatabase();
    
    // Check for Good Friday
    if (db.settings.goodFridays.includes(dateStr)) {
        alert('Cannot add mass for Good Friday');
        return;
    }
    
    // Check if mass already exists for this date
    if (db.masses[dateStr] && !confirm(`Mass already exists for ${formatDateDisplay(dateStr)}. Override?`)) {
        return;
    }
    
    // Get form data
    const massData = {
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
        db.settings.currentSerial = massData.serial - 1;
    }
    
    // Save mass data
    db.masses[dateStr] = massData;
    updateDatabase(db);
    
    // Update dashboard if on dashboard view
    if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
        updateDashboard();
    }
    
    // Show success message
    alert('Mass data saved successfully');
    
    // Reset form if it's a new entry
    if (!db.masses[dateStr]) {
        document.getElementById('mass-entry-form').reset();
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

function showMassEntry(dateStr) {
    document.getElementById('nav-mass-entry').click();
    
    const date = new Date(dateStr);
    document.getElementById('mass-year').value = date.getFullYear();
    document.getElementById('mass-month').value = date.getMonth();
    document.getElementById('mass-day').value = date.getDate();
    
    // Trigger date change to load data
    const event = new Event('change');
    document.getElementById('mass-day').dispatchEvent(event);
}

function updateMassEntryCalendar() {
    const year = parseInt(document.getElementById('mass-year').value);
    const month = parseInt(document.getElementById('mass-month').value);
    
    // Update current month-year display
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('mass-entry-current-month-year').textContent = `${monthNames[month]} ${year}`;
    
    // Generate calendar
    generateMassEntryCalendar('mass-entry-calendar', year, month);
}

function generateMassEntryCalendar(containerId, year, month) {
    const container = document.getElementById(containerId);
    const db = getDatabase();
    
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
                const massData = db.masses[dateStr] || null;
                const isGoodFriday = db.settings.goodFridays.includes(dateStr);
                
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

function massEntryPrevMonth() {
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
    updateMassEntryCalendar();
}

function massEntryNextMonth() {
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
    updateMassEntryCalendar();
}

// Personal Intentions functions
function initPersonalIntentions() {
    // Populate year dropdown
    populateYearDropdown('pi-year', 2020, 2030);
    
    // Set current year
    const currentDate = new Date();
    document.getElementById('pi-year').value = currentDate.getFullYear();
    
    // Set up event listeners
    document.getElementById('pi-year').addEventListener('change', updatePersonalIntentions);
    document.getElementById('generate-random-intentions').addEventListener('click', generateRandomIntentions);
    
    // Update view
    updatePersonalIntentions();
}

function updatePersonalIntentions() {
    const year = parseInt(document.getElementById('pi-year').value);
    const db = getDatabase();
    
    // Update fixed intentions table
    updateFixedIntentionsTable(year);
    
    // Update random intentions table
    updateRandomIntentionsTable(year);
}

function updateFixedIntentionsTable(year) {
    const db = getDatabase();
    const tableBody = document.getElementById('fixed-intentions-table');
    tableBody.innerHTML = '';
    
    db.settings.fixedIntentions.forEach(intention => {
        const dateStr = `${year}-${intention.month < 9 ? `0${intention.month + 1}` : intention.month + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
        const massData = db.masses[dateStr];
        
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

function updateRandomIntentionsTable(year) {
    const db = getDatabase();
    const tableBody = document.getElementById('random-intentions-table');
    tableBody.innerHTML = '';
    
    // Months without fixed intentions: April (3), June (5), July (6), August (7), October (9)
    const monthsWithoutFixed = [3, 5, 6, 7, 9];
    
    monthsWithoutFixed.forEach(month => {
        // Get or generate random dates for this month and year
        if (!db.personalIntentions[year]) {
            db.personalIntentions[year] = {};
        }
        
        if (!db.personalIntentions[year][month]) {
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
            db.personalIntentions[year][month] = dates;
            updateDatabase(db);
        }
        
        const dates = db.personalIntentions[year][month];
        const monthName = getMonthName(month);
        
        // Count celebrated masses for these dates
        let celebratedCount = 0;
        
        dates.forEach(day => {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
            if (db.masses[dateStr] && db.masses[dateStr].status === 'celebrated') {
                celebratedCount++;
            }
        });
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-2 px-4 border">${monthName}</td>
            <td class="py-2 px-4 border">${dates[0]}</td>
            <td class="py-2 px-4 border">${dates[1]}</td>
            <td class="py-2 px-4 border">${dates[2]}</td>
            <td class="py-2 px-4 border">
                <span class="status-badge ${celebratedCount === 3 ? 'completed' : 'pending'}">
                    ${celebratedCount}/3
                </span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function generateRandomIntentions() {
    const year = parseInt(document.getElementById('pi-year').value);
    const db = getDatabase();
    
    // Months without fixed intentions: April (3), June (5), July (6), August (7), October (9)
    const monthsWithoutFixed = [3, 5, 6, 7, 9];
    
    monthsWithoutFixed.forEach(month => {
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
        
        if (!db.personalIntentions[year]) {
            db.personalIntentions[year] = {};
        }
        
        db.personalIntentions[year][month] = dates;
    });
    
    updateDatabase(db);
    updateRandomIntentionsTable(year);
    
    alert('Random personal intentions generated for the selected year');
}

function checkPersonalIntention(day, month, year) {
    const db = getDatabase();
    
    // Check fixed intentions
    const fixedIntention = db.settings.fixedIntentions.find(i => 
        i.day === day && i.month === month
    );
    
    if (fixedIntention) return true;
    
    // Check random intentions
    if (db.personalIntentions[year] && db.personalIntentions[year][month]) {
        return db.personalIntentions[year][month].includes(day);
    }
    
    return false;
}

function getPersonalIntentionOccasion(day, month, year) {
    const db = getDatabase();
    
    // Check fixed intentions
    const fixedIntention = db.settings.fixedIntentions.find(i => 
        i.day === day && i.month === month
    );
    
    if (fixedIntention) return fixedIntention.occasion;
    
    return "Personal Intention";
}

// Deceased Suffrages functions
function initSuffrages() {
    // Set up event listeners
    document.getElementById('add-suffrage-btn').addEventListener('click', showAddSuffrageModal);
    document.getElementById('close-suffrage-modal').addEventListener('click', hideAddSuffrageModal);
    document.getElementById('cancel-suffrage').addEventListener('click', hideAddSuffrageModal);
    document.getElementById('suffrage-form').addEventListener('submit', saveSuffrage);
    document.getElementById('suffrage-filter').addEventListener('change', updateSuffragesTable);
    
    // Update view
    updateSuffragesTable();
}

function updateSuffragesTable() {
    const db = getDatabase();
    const filter = document.getElementById('suffrage-filter').value;
    const tableBody = document.getElementById('suffrages-table');
    tableBody.innerHTML = '';
    
    let suffrages = [...db.suffrages];
    
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

function saveSuffrage(e) {
    e.preventDefault();
    
    const db = getDatabase();
    const id = document.getElementById('suffrage-id').value || generateId();
    
    const suffrageData = {
        id,
        name: document.getElementById('suffrage-name').value,
        deathDate: document.getElementById('suffrage-death-date').value,
        receiptDate: document.getElementById('suffrage-receipt-date').value,
        whenCelebrated: document.getElementById('suffrage-celebrated-date').value || null
    };
    
    // Check if this is an edit or new entry
    const existingIndex = db.suffrages.findIndex(s => s.id === id);
    
    if (existingIndex >= 0) {
        // Update existing
        db.suffrages[existingIndex] = suffrageData;
    } else {
        // Add new
        db.suffrages.push(suffrageData);
    }
    
    updateDatabase(db);
    updateSuffragesTable();
    hideAddSuffrageModal();
    
    // Update dashboard if on dashboard view
    if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
        updateDashboard();
    }
    
    alert('Suffrage saved successfully');
}

function editSuffrage(id) {
    const db = getDatabase();
    const suffrage = db.suffrages.find(s => s.id === id);
    
    if (!suffrage) return;
    
    // Populate form
    document.getElementById('suffrage-id').value = suffrage.id;
    document.getElementById('suffrage-name').value = suffrage.name;
    document.getElementById('suffrage-death-date').value = suffrage.deathDate;
    document.getElementById('suffrage-receipt-date').value = suffrage.receiptDate;
    document.getElementById('suffrage-celebrated-date').value = suffrage.whenCelebrated || '';
    
    // Show modal
    document.getElementById('suffrage-modal').classList.remove('hidden');
}

function deleteSuffrage(id) {
    if (!confirm('Are you sure you want to delete this suffrage?')) return;
    
    const db = getDatabase();
    db.suffrages = db.suffrages.filter(s => s.id !== id);
    updateDatabase(db);
    updateSuffragesTable();
    
    alert('Suffrage deleted successfully');
}

// Mass Receptions functions
function initMassReceptions() {
    // Set up event listeners
    document.getElementById('add-reception-btn').addEventListener('click', showAddReceptionModal);
    document.getElementById('close-reception-modal').addEventListener('click', hideAddReceptionModal);
    document.getElementById('cancel-reception').addEventListener('click', hideAddReceptionModal);
    document.getElementById('reception-form').addEventListener('submit', saveReception);
    document.getElementById('reception-year-filter').addEventListener('change', updateReceptionsTable);
    
    // Populate year filter
    populateYearDropdown('reception-year-filter', 2020, 2030);
    document.getElementById('reception-year-filter').value = 'all';
    
    // Update view
    updateReceptionsTable();
}

function updateReceptionsTable() {
    const db = getDatabase();
    const yearFilter = document.getElementById('reception-year-filter').value;
    const tableBody = document.getElementById('receptions-table');
    tableBody.innerHTML = '';
    
    let receptions = [...db.receptions];
    
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

function saveReception(e) {
    e.preventDefault();
    
    const db = getDatabase();
    const id = document.getElementById('reception-id').value || generateId();
    
    const receptionData = {
        id,
        date: document.getElementById('reception-date').value,
        from: document.getElementById('reception-from').value,
        purpose: document.getElementById('reception-purpose').value,
        amount: parseInt(document.getElementById('reception-amount').value)
    };
    
    // Check if this is an edit or new entry
    const existingIndex = db.receptions.findIndex(r => r.id === id);
    
    if (existingIndex >= 0) {
        // Update existing
        db.receptions[existingIndex] = receptionData;
    } else {
        // Add new
        db.receptions.push(receptionData);
        
        // Update serial number
        db.settings.currentSerial += receptionData.amount;
    }
    
    updateDatabase(db);
    updateReceptionsTable();
    hideAddReceptionModal();
    
    // Update dashboard if on dashboard view
    if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
        updateDashboard();
    }
    
    alert('Mass reception saved successfully');
}

function editReception(id) {
    const db = getDatabase();
    const reception = db.receptions.find(r => r.id === id);
    
    if (!reception) return;
    
    // Populate form
    document.getElementById('reception-id').value = reception.id;
    document.getElementById('reception-date').value = reception.date;
    document.getElementById('reception-from').value = reception.from;
    document.getElementById('reception-purpose').value = reception.purpose || '';
    document.getElementById('reception-amount').value = reception.amount;
    
    // Show modal
    document.getElementById('reception-modal').classList.remove('hidden');
}

function deleteReception(id) {
    if (!confirm('Are you sure you want to delete this reception?')) return;
    
    const db = getDatabase();
    const reception = db.receptions.find(r => r.id === id);
    
    if (reception) {
        // Update serial number if this reception was added
        db.settings.currentSerial = Math.max(0, db.settings.currentSerial - reception.amount);
    }
    
    db.receptions = db.receptions.filter(r => r.id !== id);
    updateDatabase(db);
    updateReceptionsTable();
    
    alert('Reception deleted successfully');
}

// Reports functions
function initReports() {
    // Populate dropdowns
    populateYearDropdown('report-year', 2020, 2030);
    populateMonthDropdown('report-month');
    populateYearDropdown('report-yearly-year', 2020, 2030);
    
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

function generateMonthlyReport() {
    const year = parseInt(document.getElementById('report-year').value);
    const month = parseInt(document.getElementById('report-month').value);
    const db = getDatabase();
    
    const monthStr = month < 9 ? `0${month + 1}` : month + 1;
    const monthPrefix = `${year}-${monthStr}`;
    const monthName = getMonthName(month);
    
    // Filter masses for this month
    const monthMasses = Object.keys(db.masses)
        .filter(dateStr => dateStr.startsWith(monthPrefix))
        .map(dateStr => ({
            date: dateStr,
            ...db.masses[dateStr]
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate stats
    let celebrated = 0;
    let missed = 0;
    let personalCelebrated = 0;
    let suffragesCelebrated = 0;
    
    monthMasses.forEach(mass => {
        if (mass.status === 'celebrated') {
            celebrated++;
            
            // Check if it's a personal intention
            const date = new Date(mass.date);
            if (checkPersonalIntention(date.getDate(), date.getMonth(), date.getFullYear())) {
                personalCelebrated++;
            }
        } else {
            missed++;
        }
    });
    
    // Check suffrages for this month
    const monthSuffrages = db.suffrages.filter(s => 
        s.whenCelebrated && s.whenCelebrated.startsWith(monthPrefix)
    );
    suffragesCelebrated = monthSuffrages.length;
    
    // Check personal intentions fulfillment
    const personalFulfilled = personalCelebrated >= 3;
    
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
                <p>Personal Masses Celebrated: <span class="font-bold">${personalCelebrated}/3</span></p>
                <p>Status: <span class="font-bold ${personalFulfilled ? 'text-green-600' : 'text-red-600'}">${personalFulfilled ? 'Fulfilled' : 'Not Fulfilled'}</span></p>
            </div>
            
            <div class="bg-green-50 p-3 rounded border border-green-200">
                <h5 class="font-medium text-green-800 mb-2">Deceased Suffrages</h5>
                <p>Suffrages Celebrated: <span class="font-bold">${suffragesCelebrated}</span></p>
            </div>
            
            <div class="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h5 class="font-medium text-yellow-800 mb-2">Intentions</h5>
                <p>Current Serial Number: <span class="font-bold">${db.settings.currentSerial}</span></p>
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
    
    monthMasses.forEach(mass => {
        const date = new Date(mass.date);
        const isPersonal = checkPersonalIntention(date.getDate(), date.getMonth(), date.getFullYear());
        
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
    });
    
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
    
    // Get all personal intentions for this month
    const personalIntentions = [];
    
    // Fixed intentions
    db.settings.fixedIntentions.forEach(intention => {
        if (intention.month === month) {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
            const massData = db.masses[dateStr];
            
            personalIntentions.push({
                date: dateStr,
                occasion: intention.occasion,
                celebrated: massData && massData.status === 'celebrated'
            });
        }
    });
    
    // Random intentions
    if (db.personalIntentions[year] && db.personalIntentions[year][month]) {
        db.personalIntentions[year][month].forEach(day => {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
            const massData = db.masses[dateStr];
            
            personalIntentions.push({
                date: dateStr,
                occasion: "Personal Intention",
                celebrated: massData && massData.status === 'celebrated'
            });
        });
    }
    
    // Sort by date
    personalIntentions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    personalIntentions.forEach(intention => {
        reportHTML += `
            <tr class="${intention.celebrated ? 'bg-green-50' : 'bg-yellow-50'}">
                <td class="py-2 px-4 border">${formatDateDisplay(intention.date)}</td>
                <td class="py-2 px-4 border">${intention.occasion}</td>
                <td class="py-2 px-4 border">
                    <span class="status-badge ${intention.celebrated ? 'completed' : 'pending'}">
                        ${intention.celebrated ? 'Celebrated' : 'Pending'}
                    </span>
                </td>
            </tr>`;
    });
    
    reportHTML += `
                </tbody>
            </table>
        </div>`;
    
    // Display report
    document.getElementById('report-title').textContent = `Monthly Report - ${monthName} ${year}`;
    document.getElementById('report-content').innerHTML = reportHTML;
    document.getElementById('report-display').classList.remove('hidden');
}

function generateYearlyReport() {
    const year = parseInt(document.getElementById('report-yearly-year').value);
    const db = getDatabase();
    
    // Filter masses for this year
    const yearMasses = Object.keys(db.masses)
        .filter(dateStr => dateStr.startsWith(year))
        .map(dateStr => ({
            date: dateStr,
            ...db.masses[dateStr]
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate stats
    let celebrated = 0;
    let missed = 0;
    let personalCelebrated = 0;
    let suffragesCelebrated = 0;
    
    yearMasses.forEach(mass => {
        if (mass.status === 'celebrated') {
            celebrated++;
            
            // Check if it's a personal intention
            const date = new Date(mass.date);
            if (checkPersonalIntention(date.getDate(), date.getMonth(), date.getFullYear())) {
                personalCelebrated++;
            }
        } else {
            missed++;
        }
    });
    
    // Check suffrages for this year
    const yearSuffrages = db.suffrages.filter(s => 
        s.whenCelebrated && s.whenCelebrated.startsWith(year)
    );
    suffragesCelebrated = yearSuffrages.length;
    
    // Calculate personal intentions fulfillment by month
    const monthlyPersonal = Array(12).fill(0).map((_, month) => {
        if (!db.personalIntentions[year] || !db.personalIntentions[year][month]) return 0;
        
        return db.personalIntentions[year][month].reduce((count, day) => {
            const dateStr = `${year}-${month < 9 ? `0${month + 1}` : month + 1}-${day < 10 ? `0${day}` : day}`;
            return count + (db.masses[dateStr] && db.masses[dateStr].status === 'celebrated' ? 1 : 0);
        }, 0);
    });
    
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
                <p>Total Personal Masses Celebrated: <span class="font-bold">${personalCelebrated}</span></p>
                <p>Average per Month: <span class="font-bold">${(personalCelebrated / 12).toFixed(1)}</span></p>
            </div>
            
            <div class="bg-green-50 p-3 rounded border border-green-200">
                <h5 class="font-medium text-green-800 mb-2">Deceased Suffrages</h5>
                <p>Suffrages Celebrated: <span class="font-bold">${suffragesCelebrated}</span></p>
                <p>Pending Suffrages: <span class="font-bold">${db.suffrages.filter(s => !s.whenCelebrated).length}</span></p>
            </div>
            
            <div class="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h5 class="font-medium text-yellow-800 mb-2">Intentions</h5>
                <p>Current Serial Number: <span class="font-bold">${db.settings.currentSerial}</span></p>
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
    
    const pendingSuffrages = db.suffrages.filter(s => !s.whenCelebrated);
    
    if (pendingSuffrages.length > 0) {
        pendingSuffrages.forEach(suffrage => {
            reportHTML += `
                <tr>
                    <td class="py-2 px-4 border">${formatDateDisplay(suffrage.deathDate)}</td>
                    <td class="py-2 px-4 border">${suffrage.name}</td>
                </tr>`;
        });
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
function initSettings() {
    // Set up event listeners
    document.getElementById('backup-data').addEventListener('click', backupData);
    document.getElementById('restore-data').addEventListener('click', triggerRestore);
    document.getElementById('restore-file').addEventListener('change', restoreData);
    document.getElementById('reset-data').addEventListener('click', resetData);
    document.getElementById('add-fixed-date').addEventListener('click', addFixedDate);
}

function backupData() {
    const db = getDatabase();
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `msfs-mass-tracker-backup-${formatDate(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    alert('Backup created successfully');
}

function triggerRestore() {
    document.getElementById('restore-file').click();
}

function restoreData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm('Are you sure you want to restore from backup? This will overwrite all current data.')) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            updateDatabase(data);
            alert('Data restored successfully');
            location.reload(); // Refresh to show restored data
        } catch (error) {
            alert('Error restoring data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        return;
    }
    
    localStorage.removeItem('msfsMassTracker');
    initDatabase();
    alert('Data reset successfully');
    location.reload(); // Refresh to show clean state
}

function addFixedDate() {
    const day = parseInt(document.getElementById('new-fixed-day').value);
    const month = parseInt(document.getElementById('new-fixed-month').value);
    const occasion = document.getElementById('new-fixed-occasion').value.trim();
    
    if (!occasion) {
        alert('Please enter an occasion');
        return;
    }
    
    const db = getDatabase();
    
    // Check if this date already exists
    const exists = db.settings.fixedIntentions.some(i => 
        i.day === day && i.month === month
    );
    
    if (exists) {
        alert('This date already has a fixed intention');
        return;
    }
    
    // Add new fixed intention
    db.settings.fixedIntentions.push({
        day,
        month,
        occasion
    });
    
    updateDatabase(db);
    
    // Reset form
    document.getElementById('new-fixed-occasion').value = '';
    
    // Update view
    updateFixedIntentionsTable(document.getElementById('pi-year').value);
    
    alert('Fixed date added successfully');
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

// Helper functions
function populateYearDropdown(id, startYear, endYear) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
}

function populateMonthDropdown(id) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    
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
}

function populateDayDropdown(id) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        select.appendChild(option);
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForInput(date) {
    return formatDate(date);
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

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function setupModalListeners() {
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.fixed');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
    
    // Import modal listeners
    document.getElementById('close-import-modal').addEventListener('click', hideImportModal);
    document.getElementById('cancel-import').addEventListener('click', hideImportModal);
    document.getElementById('confirm-import').addEventListener('click', function() {
        alert('Import functionality would be implemented here');
        hideImportModal();
    });
}

function checkReminders() {
    const db = getDatabase();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Check personal intentions for current month
    let personalCelebrated = 0;
    
    // Check fixed intentions
    db.settings.fixedIntentions.forEach(intention => {
        if (intention.month === currentMonth) {
            const dateStr = `${currentYear}-${currentMonth < 9 ? `0${currentMonth + 1}` : currentMonth + 1}-${intention.day < 10 ? `0${intention.day}` : intention.day}`;
            if (db.masses[dateStr] && db.masses[dateStr].status === 'celebrated') {
                personalCelebrated++;
            }
        }
    });
    
    // Check random intentions
    if (db.personalIntentions[currentYear] && db.personalIntentions[currentYear][currentMonth]) {
        db.personalIntentions[currentYear][currentMonth].forEach(day => {
            const dateStr = `${currentYear}-${currentMonth < 9 ? `0${currentMonth + 1}` : currentMonth + 1}-${day < 10 ? `0${day}` : day}`;
            if (db.masses[dateStr] && db.masses[dateStr].status === 'celebrated') {
                personalCelebrated++;
            }
        });
    }
    
    // Show reminder if less than 3 personal masses celebrated
    if (personalCelebrated < 3) {
        const remaining = 3 - personalCelebrated;
        const reminder = document.createElement('div');
        reminder.className = 'mb-2';
        reminder.innerHTML = `<i class="fas fa-bell mr-2"></i>Celebrate ${remaining} more personal mass${remaining > 1 ? 'es' : ''} this month`;
        
        document.getElementById('reminders-container').appendChild(reminder);
    }
}

function loadInitialData() {
    const db = getDatabase();
    
    // Load sample data if database is empty
    if (Object.keys(db.masses).length === 0 && db.suffrages.length === 0 && db.receptions.length === 0) {
        // Sample mass receptions
        db.receptions = [
            { id: '1', date: '2020-12-22', from: 'NGP Province', purpose: 'General suffrages', amount: 300 },
            { id: '2', date: '2022-01-26', from: 'NGP Province', purpose: 'General suffrages', amount: 300 },
            { id: '3', date: '2022-06-05', from: 'Generalate', purpose: 'General suffrages', amount: 300 },
            { id: '4', date: '2023-08-23', from: 'NGP Province', purpose: 'General suffrages', amount: 300 }
        ];
        
        // Sample suffrages
        db.suffrages = [
            { id: '1', name: 'Fr. Bernard Casso', deathDate: '2023-03-11', receiptDate: '2023-03-11', whenCelebrated: '2023-03-12' },
            { id: '2', name: 'Fr. Jose Puthiyaparambil', deathDate: '2024-05-02', receiptDate: '2024-05-02', whenCelebrated: '2024-05-03' }
        ];
        
        // Set initial serial number
        db.settings.currentSerial = 300;
        
        updateDatabase(db);
    }
}
