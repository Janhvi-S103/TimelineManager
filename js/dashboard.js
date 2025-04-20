// State for tracking current timeline
let currentTimelineId = null;
let draggedEventId = null;

// Initialize dashboard
function initDashboard() {
    loadTimelines();
    
    // Set up event listeners
    document.getElementById('new-timeline-btn').addEventListener('click', () => {
        document.getElementById('timeline-modal-title').textContent = 'New Timeline';
        document.getElementById('timeline-form').dataset.mode = 'create';
        document.getElementById('timeline-title').value = '';
        document.getElementById('timeline-description').value = '';
        showModal('timeline-modal');
    });
    
    document.getElementById('add-event-btn').addEventListener('click', () => {
        if (!currentTimelineId) {
            alert('Please select or create a timeline first');
            return;
        }
        
        document.getElementById('modal-title').textContent = 'Add Event';
        document.getElementById('event-form').dataset.mode = 'create';
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('event-description').value = '';
        showModal('event-modal');
    });
    
    document.getElementById('edit-timeline-btn').addEventListener('click', () => {
        if (!currentTimelineId) return;
        
        const timeline = getTimelineById(currentTimelineId);
        if (!timeline) return;
        
        document.getElementById('timeline-modal-title').textContent = 'Edit Timeline';
        document.getElementById('timeline-form').dataset.mode = 'edit';
        document.getElementById('timeline-title').value = timeline.title;
        document.getElementById('timeline-description').value = timeline.description || '';
        showModal('timeline-modal');
    });
    
    document.getElementById('delete-timeline-btn').addEventListener('click', () => {
        if (!currentTimelineId) return;
        
        if (confirm('Are you sure you want to delete this timeline? This action cannot be undone.')) {
            deleteTimeline(currentTimelineId);
        }
    });
    
    // Set up form submissions
    document.getElementById('timeline-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const mode = e.target.dataset.mode;
        const timelineData = {
            title: document.getElementById('timeline-title').value,
            description: document.getElementById('timeline-description').value
        };
        
        if (mode === 'create') {
            createTimeline(timelineData);
        } else if (mode === 'edit') {
            updateTimeline(currentTimelineId, timelineData);
        }
        
        hideModal('timeline-modal');
    });
    
    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const mode = e.target.dataset.mode;
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            description: document.getElementById('event-description').value
        };
        
        if (mode === 'create') {
            addEvent(currentTimelineId, eventData);
        } else if (mode === 'edit') {
            const eventId = e.target.dataset.eventId;
            updateEvent(currentTimelineId, eventId, eventData);
        }
        
        hideModal('event-modal');
    });
}

// Load timelines from localStorage
function loadTimelines() {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    renderTimelineList(timelines);
    
    // If there are timelines, load the first one by default
    if (timelines.length > 0) {
        selectTimeline(timelines[0].id);
    } else {
        renderEmptyState();
    }
}

// Get user timelines
function getUserTimelines(userId) {
    return JSON.parse(localStorage.getItem(`timelines_${userId}`) || '[]');
}

// Save user timelines
function saveUserTimelines(userId, timelines) {
    localStorage.setItem(`timelines_${userId}`, JSON.stringify(timelines));
    
    // Update last updated timestamp for profile stats
    localStorage.setItem(`lastUpdated_${userId}`, new Date().toISOString());
}

// Render timeline list in sidebar
function renderTimelineList(timelines) {
    const listElement = document.getElementById('timeline-list');
    listElement.innerHTML = '';
    
    if (timelines.length === 0) {
        listElement.innerHTML = '<li class="empty-list">No timelines yet. Create one to get started.</li>';
        return;
    }
    
    timelines.forEach(timeline => {
        const timelineItem = document.createElement('li');
        timelineItem.className = 'timeline-item';
        timelineItem.dataset.id = timeline.id;
        if (timeline.id === currentTimelineId) {
            timelineItem.classList.add('active');
        }
        
        timelineItem.textContent = timeline.title;
        timelineItem.addEventListener('click', () => selectTimeline(timeline.id));
        
        listElement.appendChild(timelineItem);
    });
}

// Select a timeline to display
function selectTimeline(timelineId) {
    currentTimelineId = timelineId;
    
    // Update UI state
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.classList.toggle('active', item.dataset.id === timelineId);
    });
    
    const timeline = getTimelineById(timelineId);
    if (timeline) {
        document.getElementById('current-timeline-title').textContent = timeline.title;
        document.getElementById('edit-timeline-btn').style.display = 'inline-block';
        document.getElementById('delete-timeline-btn').style.display = 'inline-block';
        document.getElementById('add-event-btn').style.display = 'inline-block';
        document.getElementById('empty-state').style.display = 'none';
        
        renderEvents(timeline);
    } else {
        renderEmptyState();
    }
}

// Render timeline events
function renderEvents(timeline) {
    const eventsContainer = document.getElementById('timeline-container');
    eventsContainer.innerHTML = '';
    
    if (!timeline.events || timeline.events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>No events in this timeline. Add your first event to get started.</p>
            </div>
        `;
        return;
    }
    
    // Sort events by date
    const sortedEvents = sortEventsByDate(timeline.events);
    
    sortedEvents.forEach(event => {
        const eventElement = createEventElement(event);
        eventsContainer.appendChild(eventElement);
    });
    
    // Set up drag and drop for reordering
    setupDragAndDrop();
}

// Create event element
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'timeline-event';
    eventElement.dataset.id = event.id;
    eventElement.draggable = true;
    
    eventElement.innerHTML = `
        <span class="drag-handle">⋮</span>
        <div class="event-date">${formatDate(event.date)}</div>
        <h3 class="event-title">${event.title}</h3>
        <p class="event-description">${event.description || ''}</p>
        <div class="event-actions">
            <button class="action-btn edit" title="Edit Event">✏️</button>
            <button class="action-btn delete" title="Delete Event">🗑️</button>
        </div>
    `;
    
    // Add event listeners for edit and delete
    eventElement.querySelector('.edit').addEventListener('click', () => {
        editEvent(event);
    });
    
    eventElement.querySelector('.delete').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(currentTimelineId, event.id);
        }
    });
    
    // Add drag event listeners
    eventElement.addEventListener('dragstart', handleDragStart);
    eventElement.addEventListener('dragend', handleDragEnd);
    eventElement.addEventListener('dragover', handleDragOver);
    eventElement.addEventListener('dragleave', handleDragLeave);
    eventElement.addEventListener('drop', handleDrop);
    
    return eventElement;
}

// Show empty state
function renderEmptyState() {
    document.getElementById('current-timeline-title').textContent = 'Select a Timeline';
    document.getElementById('edit-timeline-btn').style.display = 'none';
    document.getElementById('delete-timeline-btn').style.display = 'none';
    document.getElementById('add-event-btn').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('timeline-container').innerHTML = '';
}

// Create new timeline
function createTimeline(timelineData) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    const newTimeline = {
        id: generateId(),
        title: timelineData.title,
        description: timelineData.description || '',
        createdAt: new Date().toISOString(),
        events: []
    };
    
    timelines.push(newTimeline);
    saveUserTimelines(userId, timelines);
    
    renderTimelineList(timelines);
    selectTimeline(newTimeline.id);
}

// Update existing timeline
function updateTimeline(timelineId, timelineData) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    const timelineIndex = timelines.findIndex(t => t.id === timelineId);
    if (timelineIndex !== -1) {
        timelines[timelineIndex] = {
            ...timelines[timelineIndex],
            title: timelineData.title,
            description: timelineData.description || '',
            updatedAt: new Date().toISOString()
        };
        
        saveUserTimelines(userId, timelines);
        renderTimelineList(timelines);
        selectTimeline(timelineId);
    }
}

// Delete timeline
function deleteTimeline(timelineId) {
    const userId = getCurrentUser().id;
    let timelines = getUserTimelines(userId);
    
    timelines = timelines.filter(t => t.id !== timelineId);
    saveUserTimelines(userId, timelines);
    
    currentTimelineId = null;
    renderTimelineList(timelines);
    
    if (timelines.length > 0) {
        selectTimeline(timelines[0].id);
    } else {
        renderEmptyState();
    }
}

// Get timeline by ID
function getTimelineById(timelineId) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    return timelines.find(t => t.id === timelineId) || null;
}

// Add event to timeline
function addEvent(timelineId, eventData) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    const timelineIndex = timelines.findIndex(t => t.id === timelineId);
    if (timelineIndex === -1) return;
    
    const newEvent = {
        id: generateId(),
        title: eventData.title,
        date: eventData.date,
        description: eventData.description || '',
        createdAt: new Date().toISOString()
    };
    
    if (!timelines[timelineIndex].events) {
        timelines[timelineIndex].events = [];
    }
    
    timelines[timelineIndex].events.push(newEvent);
    timelines[timelineIndex].updatedAt = new Date().toISOString();
    
    saveUserTimelines(userId, timelines);
    renderEvents(timelines[timelineIndex]);
}

// Edit event
function editEvent(event) {
    document.getElementById('modal-title').textContent = 'Edit Event';
    document.getElementById('event-form').dataset.mode = 'edit';
    document.getElementById('event-form').dataset.eventId = event.id;
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-description').value = event.description || '';
    
    showModal('event-modal');
}

// Update event
function updateEvent(timelineId, eventId, eventData) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    const timelineIndex = timelines.findIndex(t => t.id === timelineId);
    if (timelineIndex === -1) return;
    
    const timeline = timelines[timelineIndex];
    const eventIndex = timeline.events.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
        timeline.events[eventIndex] = {
            ...timeline.events[eventIndex],
            title: eventData.title,
            date: eventData.date,
            description: eventData.description || '',
            updatedAt: new Date().toISOString()
        };
        
        timelines[timelineIndex].updatedAt = new Date().toISOString();
        saveUserTimelines(userId, timelines);
        renderEvents(timeline);
    }
}

// Delete event
function deleteEvent(timelineId, eventId) {
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    
    const timelineIndex = timelines.findIndex(t => t.id === timelineId);
    if (timelineIndex === -1) return;
    
    const timeline = timelines[timelineIndex];
    timeline.events = timeline.events.filter(e => e.id !== eventId);
    timeline.updatedAt = new Date().toISOString();
    
    saveUserTimelines(userId, timelines);
    renderEvents(timeline);
}

// Drag and drop functionality
function setupDragAndDrop() {
    const timelineEvents = document.querySelectorAll('.timeline-event');
    timelineEvents.forEach(event => {
        event.addEventListener('dragstart', handleDragStart);
        event.addEventListener('dragend', handleDragEnd);
        event.addEventListener('dragover', handleDragOver);
        event.addEventListener('dragleave', handleDragLeave);
        event.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedEventId = this.dataset.id;
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (!draggedEventId || draggedEventId === this.dataset.id) return;
    
    const userId = getCurrentUser().id;
    const timelines = getUserTimelines(userId);
    const timelineIndex = timelines.findIndex(t => t.id === currentTimelineId);
    
    if (timelineIndex === -1) return;
    
    const timeline = timelines[timelineIndex];
    const draggedEvent = timeline.events.find(e => e.id === draggedEventId);
    const targetEvent = timeline.events.find(e => e.id === this.dataset.id);
    
    if (!draggedEvent || !targetEvent) return;
    
    // Update custom order property on events for manual sorting
    // This allows us to keep date sort as primary but have manual override
    if (!timeline.events.some(e => e.order !== undefined)) {
        // Initialize order if not present
        timeline.events.forEach((e, index) => e.order = index);
    }
    
    const draggedIndex = timeline.events.findIndex(e => e.id === draggedEventId);
    const targetIndex = timeline.events.findIndex(e => e.id === this.dataset.id);
    
    // Remove dragged event from array
    const [removed] = timeline.events.splice(draggedIndex, 1);
    
    // Insert at the new position
    timeline.events.splice(targetIndex, 0, removed);
    
    // Update order values
    timeline.events.forEach((e, index) => e.order = index);
    
    timelines[timelineIndex].updatedAt = new Date().toISOString();
    saveUserTimelines(userId, timelines);
    renderEvents(timeline);
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', initDashboard);