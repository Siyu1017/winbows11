var theme = System.theme.get()
browserWindow.setTheme(theme);
if (theme == 'dark') {
    document.documentElement.classList.add('winui-dark');
} else {
    document.documentElement.classList.remove('winui-dark');
}

System.theme.onChange(theme => {
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
    }
})

const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(path.resolve('./window.css'));
document.head.appendChild(style);

process.title = 'Task Manager';

const icons = {
    tasks: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-item-icon"><path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"></path></svg>',
    performance: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-item-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M17 12h-2l-2 5-2-10-2 5H7"/></svg>',
    history: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-item-icon"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    run: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-item-icon"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-item-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
}

const searchContainer = document.createElement('div');
const searchBox = document.createElement('div');
const searchIcon = document.createElement('div');
const searchInput = document.createElement('input');

searchContainer.className = 'search-container';
searchBox.className = 'search-box';
searchIcon.className = 'search-icon';
searchInput.className = 'search-input';
searchInput.placeholder = 'Search...';

browserWindow.toolbar.appendChild(searchContainer);
searchContainer.appendChild(searchBox);
searchBox.appendChild(searchIcon);
searchBox.appendChild(searchInput);

searchInput.addEventListener('focus', () => {
    searchBox.classList.add('focused');
})
searchInput.addEventListener('blur', () => {
    searchBox.classList.remove('focused');
})

browserWindow.setImmovable(searchBox);

var focusedIcon = 'tasks';
const app = document.createElement('div');
const sidebar = document.createElement('div');
const content = document.createElement('div');
const taskList = document.createElement('div');
const taskHeader = document.createElement('div');
const taskListNoMatched = document.createElement('div');

app.className = 'app';
sidebar.className = 'sidebar';
content.className = 'content';
taskList.className = 'tasks';
taskHeader.className = 'task-header';
taskListNoMatched.className = 'task';
taskListNoMatched.innerHTML = 'No matched tasks';
taskListNoMatched.style.display = 'none';
taskListNoMatched.style.textAlign = 'center';
taskListNoMatched.style.pointerEvents = 'none';
taskListNoMatched.style.userSelect = 'none';

document.body.appendChild(app);
app.appendChild(sidebar);
app.appendChild(content);
content.appendChild(taskHeader);
content.appendChild(taskList);
taskList.appendChild(taskListNoMatched);

searchInput.addEventListener('input', (e) => {
    var mathced = false;
    Object.values(taskItems).forEach(task => {
        if (task.title && task.title.toLowerCase().includes(searchInput.value.toLowerCase()) || task.pid && task.pid.toString().includes(searchInput.value)) {
            mathced = true;
            task.task.style.display = 'flex';
        } else {
            task.task.style.display = 'none';
        }
    })
    if (mathced == false) {
        taskListNoMatched.style.display = 'block';
    } else {
        taskListNoMatched.style.display = 'none';
    }
})

document.body.classList.add('winui');

Object.keys(icons).forEach(key => {
    var icon = icons[key];
    var item = document.createElement('div');
    item.className = 'sidebar-item';
    item.innerHTML = icon;
    if (key == focusedIcon) {
        item.classList.add('active');
    }
    sidebar.appendChild(item);
})

!(() => {
    var taskHeaderInfo = document.createElement('div');
    var taskHeaderPid = document.createElement('div');

    taskHeaderInfo.className = 'task-info';
    taskHeaderPid.className = 'task-pid';

    taskHeaderInfo.innerHTML = 'Name';
    taskHeaderPid.innerHTML = 'PID';

    taskHeader.appendChild(taskHeaderInfo);
    taskHeader.appendChild(taskHeaderPid);
})();

var menu = null;
new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
    window.addEventListener(event, (e) => {
        document.querySelectorAll('.task.active').forEach(el => {
            el.classList.remove('active');
        })
        if (menu == null) return;
        if (menu.container.contains(e.target)) return;
        menu.close();
    })
})

const taskItems = {};

function createTaskItem(task) {
    const runtimeID = task.runtimeID;
    const pid = task.process.pid;
    const info = System.appRegistry.getInfoByPath(task.__filename);
    const title = task.title || 'App';
    const taskEl = document.createElement('div');
    const taskInfo = document.createElement('div');
    const taskIcon = document.createElement('div');
    const taskName = document.createElement('div');
    const taskPid = document.createElement('div');

    taskEl.className = 'task';
    taskInfo.className = 'task-info';
    taskIcon.className = 'task-icon';
    taskName.className = 'task-name';
    taskPid.className = 'task-pid';

    taskName.innerHTML = title.replace(/</, '&lt;').replace(/>/, '&gt;');

    if (task.icon) {
        taskIcon.style.backgroundImage = `url(${task.icon})`;
    } else {
        fs.getFileURL(info.icon || 'C:/Winbows/icons/files/program.ico').then(url => {
            taskIcon.style.backgroundImage = `url(${url})`;
        })
    }

    taskPid.innerHTML = pid;

    if (title.toLowerCase().includes(searchInput.value.toLowerCase()) || pid.toString().includes(searchInput.value)) {
        taskEl.style.display = 'flex';
        taskListNoMatched.style.display = 'none';
    } else {
        taskEl.style.display = 'none';
    }

    taskEl.appendChild(taskInfo);
    taskInfo.appendChild(taskIcon);
    taskInfo.appendChild(taskName);
    taskEl.appendChild(taskPid);
    taskList.appendChild(taskEl);

    function changeIcon(icon) {
        taskIcon.style.backgroundImage = `url(${icon})`;
    }

    function changeName(name) {
        taskName.innerHTML = name.replace(/</, '&lt;').replace(/>/, '&gt;');
    }

    function exit() {
        taskEl.remove();
        delete taskItems[runtimeID];
        task.process.exit(0);
    }

    taskEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu = WinUI.contextMenu([
            {
                icon: "clear",
                className: "delete",
                text: "Kill process",
                action: exit
            }
        ])
        taskEl.classList.add('active');

        let x = e.pageX, y = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        }
        menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        menu.open(x, y, 'left-top');
    })

    taskItems[runtimeID] = { title, pid: pid.toString(), task: taskEl, changeIcon, changeName, exit };

    return { changeIcon, changeName, exit };
}

System.tasklist.list().forEach(runtimeID => {
    createTaskItem({
        runtimeID,
        ...System.tasklist.get(runtimeID)
    });
})

System.tasklist.on('add', (e) => {
    if (!taskItems[e.runtimeID]) {
        createTaskItem({
            runtimeID: e.runtimeID,
            ...e.task
        });
    }
});

System.tasklist.on('remove', (e) => {
    const item = taskItems[e.id];
    if (item) {
        item.exit();
    }
})

System.tasklist.on('update', (e) => {
    const item = taskItems[e.id];
    if (item) {
        if (e.key == 'title') {
            item.changeName(e.value);
        } else if (e.key == 'icon') {
            fs.getFileURL(e.value || 'C:/Winbows/icons/files/program.ico').then(url => {
                item.changeIcon(url);
            })
        }
    }
})


/*
System.processes.prototype.addEventListener('start', (e) => {
    createTaskItem(e.pid);
})

window.Process.prototype.addEventListener('exit', (e) => {
    if (taskItems[e.pid]) {
        taskItems[e.pid].exit();
    }
})*/