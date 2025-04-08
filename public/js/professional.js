document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load initial data
    loadAppointments();
    loadServices();
    
    // Modal controls
    const modal = document.getElementById('serviceModal');
    document.getElementById('newServiceBtn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    
    document.getElementById('closeServiceModalBtn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    });
    
    // Service form submission
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceData = {
            name: document.getElementById('serviceName').value,
            description: document.getElementById('serviceDescription').value,
            duration: parseInt(document.getElementById('serviceDuration').value),
            price: parseFloat(document.getElementById('servicePrice').value)
        };
        
        try {
            const response = await fetch('/api/professional/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(serviceData)
            });
            
            if (response.ok) {
                modal.classList.add('hidden');
                document.getElementById('serviceForm').reset();
                loadServices();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create service');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating service');
        }
    });
    
    // Filters
    document.getElementById('dateFilter').addEventListener('change', loadAppointments);
    document.getElementById('clientFilter').addEventListener('input', loadAppointments);
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
        const date = document.getElementById('dateFilter').value;
        const clientName = document.getElementById('clientFilter').value;
        
        let url = '/api/professional/appointments';
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (clientName) params.append('clientName', clientName);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url, {
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
            renderServices(services);
        } else {
            throw new Error('Failed to load services');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load services');
    }
}

function renderAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    const scheduledCount = document.getElementById('scheduledCount');
    const completedCount = document.getElementById('completedCount');
    
    // Clear existing content
    container.innerHTML = '';
    
    let scheduled = 0;
    let completed = 0;
    
    // Sort appointments by date (newest first)
    appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
    
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
                    <h3 class="font-semibold">${appointment.client.name}</h3>
                    <p class="text-sm text-gray-600">${date.toLocaleDateString()} às ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p class="text-sm">${appointment.service.name} - ${appointment.service.duration} min</p>
                    <p class="text-sm">Valor: R$ ${appointment.service.price.toFixed(2)}</p>
                </div>
                <div class="flex space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full ${statusColor}">${status}</span>
                    ${appointment.status === 'scheduled' ? 
                        `<button class="text-green-500 hover:text-green-700 complete-btn" data-id="${appointment._id}">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                </div>
            </div>
            ${appointment.notes ? `<p class="mt-2 text-sm text-gray-600">${appointment.notes}</p>` : ''}
        `;
        
        container.appendChild(card);
        
        if (appointment.status === 'scheduled') scheduled++;
        if (appointment.status === 'completed') completed++;
    });
    
    scheduledCount.textContent = scheduled;
    completedCount.textContent = completed;
    
    // Add event listeners to complete buttons
    document.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const appointmentId = e.currentTarget.getAttribute('data-id');
            try {
                const response = await fetch(`/api/professional/appointments/${appointmentId}/complete`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    loadAppointments();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to complete appointment');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to complete appointment');
            }
        });
    });
}

function renderServices(services) {
    const container = document.getElementById('servicesList');
    
    // Clear existing content
    container.innerHTML = '';
    
    services.forEach(service => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'border rounded-lg p-3 hover:shadow-md transition flex justify-between items-center';
        
        serviceItem.innerHTML = `
            <div>
                <h3 class="font-medium">${service.name}</h3>
                <p class="text-sm text-gray-600">${service.duration} min - R$ ${service.price.toFixed(2)}</p>
                ${service.description ? `<p class="text-xs mt-1 text-gray-500">${service.description}</p>` : ''}
            </div>
            <div class="flex space-x-2">
                <button class="text-blue-500 hover:text-blue-700 edit-btn" data-id="${service._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${service._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(serviceItem);
        
        // Add event listeners to edit and delete buttons
        serviceItem.querySelector('.edit-btn').addEventListener('click', () => editService(service));
        serviceItem.querySelector('.delete-btn').addEventListener('click', () => deleteService(service._id));
    });
}

function editService(service) {
    const modal = document.getElementById('serviceModal');
    const form = document.getElementById('serviceForm');
    
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceDescription').value = service.description || '';
    document.getElementById('serviceDuration').value = service.duration;
    document.getElementById('servicePrice').value = service.price;
    
    form.dataset.editId = service._id;
    modal.classList.remove('hidden');
    
    // Change form to update mode
    form.removeEventListener('submit', handleServiceUpdate);
    form.addEventListener('submit', handleServiceUpdate);
}

async function handleServiceUpdate(e) {
    e.preventDefault();
    
    const serviceId = e.target.dataset.editId;
    const serviceData = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        duration: parseInt(document.getElementById('serviceDuration').value),
        price: parseFloat(document.getElementById('servicePrice').value)
    };
    
    try {
        const response = await fetch(`/api/professional/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
            const modal = document.getElementById('serviceModal');
            modal.classList.add('hidden');
            document.getElementById('serviceForm').reset();
            delete e.target.dataset.editId;
            loadServices();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update service');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating service');
    }
}

async function deleteService(serviceId) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    
    try {
        const response = await fetch(`/api/professional/services/${serviceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            loadServices();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete service');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete service');
    }
}
