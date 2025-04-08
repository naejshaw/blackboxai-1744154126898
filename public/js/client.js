document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load appointments
    loadAppointments();
    
    // Modal controls
    const modal = document.getElementById('appointmentModal');
    document.getElementById('newAppointmentBtn').addEventListener('click', () => {
        loadServices();
        modal.classList.remove('hidden');
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    });
    
    // Appointment form submission
    document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceId = document.getElementById('serviceSelect').value;
        const date = document.getElementById('appointmentDate').value;
        const notes = document.getElementById('appointmentNotes').value;
        
        try {
            const response = await fetch('/api/client/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    serviceId,
                    date,
                    notes
                })
            });
            
            if (response.ok) {
                modal.classList.add('hidden');
                loadAppointments();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create appointment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating appointment');
        }
    });
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    }
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/client/appointments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const appointments = await response.json();
            renderAppointments(appointments);
        } else {
            throw new Error('Failed to load appointments');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load appointments');
    }
}

async function loadServices() {
    try {
        const response = await fetch('/api/professional/services', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const services = await response.json();
            const select = document.getElementById('serviceSelect');
            select.innerHTML = '';
            
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service._id;
                option.textContent = `${service.name} - ${service.duration} min (R$ ${service.price.toFixed(2)})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderAppointments(appointments) {
    const upcomingContainer = document.getElementById('upcomingAppointments');
    const scheduledCount = document.getElementById('scheduledCount');
    const completedCount = document.getElementById('completedCount');
    const recentHistory = document.getElementById('recentHistory');
    
    // Clear existing content
    upcomingContainer.innerHTML = '';
    recentHistory.innerHTML = '';
    
    let scheduled = 0;
    let completed = 0;
    
    // Sort appointments by date (newest first)
    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    appointments.forEach(appointment => {
        const card = document.createElement('div');
        card.className = 'border rounded-lg p-4 hover:shadow-md transition';
        
        const date = new Date(appointment.date);
        const status = appointment.status === 'scheduled' ? 'Agendado' : 
                      appointment.status === 'completed' ? 'Concluído' : 'Cancelado';
        
        const statusColor = appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold">${appointment.service.name}</h3>
                    <p class="text-sm text-gray-600">${date.toLocaleDateString()} às ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p class="text-sm">Duração: ${appointment.service.duration} min</p>
                    <p class="text-sm">Valor: R$ ${appointment.service.price.toFixed(2)}</p>
                </div>
                <div class="flex space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full ${statusColor}">${status}</span>
                    ${appointment.status === 'scheduled' ? 
                        `<button class="text-red-500 hover:text-red-700 cancel-btn" data-id="${appointment._id}">
                            <i class="fas fa-times"></i>
                        </button>` : ''}
                </div>
            </div>
            ${appointment.notes ? `<p class="mt-2 text-sm text-gray-600">${appointment.notes}</p>` : ''}
        `;
        
        if (appointment.status === 'scheduled') {
            upcomingContainer.appendChild(card);
            scheduled++;
        } else {
            const historyItem = document.createElement('div');
            historyItem.className = 'text-sm';
            historyItem.innerHTML = `
                <p>${appointment.service.name} - ${date.toLocaleDateString()}</p>
                <p class="text-xs ${statusColor.replace('bg-', 'text-')}">${status}</p>
            `;
            recentHistory.appendChild(historyItem);
            if (appointment.status === 'completed') completed++;
        }
    });
    
    scheduledCount.textContent = scheduled;
    completedCount.textContent = completed;
    
    // Add event listeners to cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const appointmentId = e.currentTarget.getAttribute('data-id');
            try {
                const response = await fetch(`/api/client/appointments/${appointmentId}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    loadAppointments();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to cancel appointment');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to cancel appointment');
            }
        });
    });
}
