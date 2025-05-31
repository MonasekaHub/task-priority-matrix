
class TaskPriorityMatrix {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('matrixTasks')) || [];
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        this.selectedQuadrant = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderAllTasks();
        this.updateStats();
    }

    bindEvents() {
        // Add task button events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.openModal();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('saveTaskBtn').addEventListener('click', () => this.saveTask());
        
        // Priority selection
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPriority(e.target));
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('taskModal')) {
                this.closeModal();
            }
        });

        // Drag and drop events
        this.setupDragAndDrop();
    }

    openModal() {
        const taskText = document.getElementById('taskInput').value.trim();
        if (taskText) {
            document.getElementById('modalTaskInput').value = taskText;
            document.getElementById('taskInput').value = '';
        }
        document.getElementById('taskModal').style.display = 'block';
        document.getElementById('modalTaskInput').focus();
    }

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.selectedQuadrant = null;
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('modalTaskInput').value = '';
    }

    selectPriority(btn) {
        document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedQuadrant = parseInt(btn.dataset.quadrant);
    }

    saveTask() {
        const taskText = document.getElementById('modalTaskInput').value.trim();
        
        if (!taskText) {
            alert('Please enter a task description');
            return;
        }

        if (!this.selectedQuadrant) {
            alert('Please select a priority quadrant');
            return;
        }

        const newTask = {
            id: this.taskIdCounter++,
            text: taskText,
            quadrant: this.selectedQuadrant,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTask(newTask);
        this.updateStats();
        this.closeModal();
    }

    renderTask(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        taskElement.innerHTML = `
            <div class="task-content">${task.text}</div>
            <div class="task-actions">
                <button class="task-btn" onclick="taskMatrix.toggleComplete(${task.id})" title="Toggle Complete">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="task-btn" onclick="taskMatrix.deleteTask(${task.id})" title="Delete">
                    🗑️
                </button>
            </div>
        `;

        document.getElementById(`quadrant-${task.quadrant}`).appendChild(taskElement);
    }

    renderAllTasks() {
        // Clear all quadrants
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`quadrant-${i}`).innerHTML = '';
        }

        // Render all tasks
        this.tasks.forEach(task => this.renderTask(task));
    }

    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderAllTasks();
            this.updateStats();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderAllTasks();
            this.updateStats();
        }
    }

    moveTask(taskId, newQuadrant) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.quadrant !== newQuadrant) {
            task.quadrant = newQuadrant;
            this.saveTasks();
            this.renderAllTasks();
        }
    }

    setupDragAndDrop() {
        // Add drag events to quadrants
        document.querySelectorAll('.quadrant').forEach(quadrant => {
            quadrant.addEventListener('dragover', this.handleDragOver);
            quadrant.addEventListener('drop', this.handleDrop.bind(this));
            quadrant.addEventListener('dragenter', this.handleDragEnter);
            quadrant.addEventListener('dragleave', this.handleDragLeave);
        });

        // Add drag events to task items (delegated)
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target && e.target.classList && (e.target.classList.contains('quadrant') || e.target.closest('.quadrant'))) {
            const quadrant = e.target.classList.contains('quadrant') ? e.target : e.target.closest('.quadrant');
            if (quadrant) quadrant.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target && e.target.classList && (e.target.classList.contains('quadrant') || e.target.closest('.quadrant'))) {
            const quadrant = e.target.classList.contains('quadrant') ? e.target : e.target.closest('.quadrant');
            if (quadrant) quadrant.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const quadrant = e.target.classList.contains('quadrant') ? e.target : e.target.closest('.quadrant');
        
        if (quadrant) {
            quadrant.classList.remove('drag-over');
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const newQuadrant = parseInt(quadrant.dataset.quadrant);
            this.moveTask(taskId, newQuadrant);
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
    }

    saveTasks() {
        localStorage.setItem('matrixTasks', JSON.stringify(this.tasks));
    }

    // Export/Import functionality
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'task-priority-matrix.json';
        link.click();
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
                    this.saveTasks();
                    this.renderAllTasks();
                    this.updateStats();
                    alert('Tasks imported successfully!');
                }
            } catch (error) {
                alert('Error importing tasks. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
            this.tasks = [];
            this.taskIdCounter = 1;
            this.saveTasks();
            this.renderAllTasks();
            this.updateStats();
        }
    }
}

// Initialize the application
const taskMatrix = new TaskPriorityMatrix();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        taskMatrix.openModal();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        taskMatrix.closeModal();
    }
});

// Add some sample tasks for demonstration (only on first load)
if (taskMatrix.tasks.length === 0) {
    const sampleTasks = [
        { id: 1, text: "Fix critical bug in production", quadrant: 1, completed: false, createdAt: new Date().toISOString() },
        { id: 2, text: "Plan quarterly strategy meeting", quadrant: 2, completed: false, createdAt: new Date().toISOString() },
        { id: 3, text: "Respond to non-urgent emails", quadrant: 3, completed: false, createdAt: new Date().toISOString() },
        { id: 4, text: "Organize desktop files", quadrant: 4, completed: true, createdAt: new Date().toISOString() }
    ];
    
    taskMatrix.tasks = sampleTasks;
    taskMatrix.taskIdCounter = 5;
    taskMatrix.saveTasks();
    taskMatrix.renderAllTasks();
    taskMatrix.updateStats();
}

// Add context menu for additional options
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('task-item')) {
        e.preventDefault();
        // Could add context menu here for more options
    }
});

// Add touch support for mobile drag and drop
let touchItem = null;
let touchOffset = { x: 0, y: 0 };

document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('task-item')) {
        touchItem = e.target;
        const touch = e.touches[0];
        const rect = touchItem.getBoundingClientRect();
        touchOffset.x = touch.clientX - rect.left;
        touchOffset.y = touch.clientY - rect.top;
        touchItem.style.zIndex = '1000';
        touchItem.style.position = 'fixed';
    }
});

document.addEventListener('touchmove', (e) => {
    if (touchItem) {
        e.preventDefault();
        const touch = e.touches[0];
        touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
        touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';
    }
});

document.addEventListener('touchend', (e) => {
    if (touchItem) {
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const quadrant = elementBelow?.closest('.quadrant');
        
        if (quadrant) {
            const taskId = parseInt(touchItem.dataset.taskId);
            const newQuadrant = parseInt(quadrant.dataset.quadrant);
            taskMatrix.moveTask(taskId, newQuadrant);
        }
        
        // Reset styles
        touchItem.style.position = '';
        touchItem.style.zIndex = '';
        touchItem.style.left = '';
        touchItem.style.top = '';
        touchItem = null;
    }
});
