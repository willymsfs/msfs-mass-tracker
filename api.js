const API_BASE = 'http://localhost:3000/api';

export default {
    async getMasses() {
        const response = await fetch(`${API_BASE}/masses`);
        return await response.json();
    },
    
    async saveMass(massData) {
        const response = await fetch(`${API_BASE}/masses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(massData)
        });
        return await response.json();
    },
    
    // Add similar methods for other data types
};
