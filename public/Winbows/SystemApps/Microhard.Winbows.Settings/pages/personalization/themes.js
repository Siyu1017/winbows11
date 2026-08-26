const themes = [
    ['light', 'Light', 'Use a light appearance across Winbows.'],
    ['dark', 'Dark', 'Use a dark appearance across Winbows.']
];

module.exports = function main() {
    const container = document.createElement('div');
    const title = document.createElement('div');
    const description = document.createElement('div');
    const choices = document.createElement('div');
    container.className = 'personalization-section';
    title.className = 'personalization-section-title';
    description.className = 'personalization-section-description';
    choices.className = 'personalization-choice-grid';
    title.innerText = 'Choose your mode';
    description.innerText = 'This changes the appearance of the desktop, taskbar, and supported apps.';

    themes.forEach(([value, label, detail]) => {
        const button = document.createElement('button');
        const preview = document.createElement('span');
        const text = document.createElement('span');
        button.type = 'button';
        button.className = 'personalization-choice';
        preview.className = `personalization-choice-preview personalization-theme-preview ${value === 'dark' ? 'dark' : ''}`;
        text.className = 'personalization-choice-label';
        text.innerText = label;
        button.title = detail;
        if (System.theme.get() === value) button.classList.add('selected');
        button.addEventListener('click', () => {
            System.theme.set(value);
            choices.querySelectorAll('.personalization-choice.selected').forEach(choice => choice.classList.remove('selected'));
            button.classList.add('selected');
        });
        button.append(preview, text);
        choices.appendChild(button);
    });
    container.append(title, description, choices);
    return container;
};
