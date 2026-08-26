const path = await requireAsync('node:path');
const { createThumbnail } = await requireAsync('../../utils.js');

const backgrounds = [
    ['img0.jpg', 'Bloom'], ['img19.jpg', 'Bloom (dark)'], ['img20.jpg', 'Glow1'], ['img21.jpg', 'Glow2'],
    ['img22.jpg', 'Glow3'], ['img23.jpg', 'Glow4'], ['img24.jpg', 'Sunrise1'], ['img28.jpg', 'Sunrise2'],
    ['img29.jpg', 'Sunrise3'], ['img30.jpg', 'Sunrise4'], ['img31.jpg', 'Sunrise5'], ['img32.jpg', 'Flow1'],
    ['img33.jpg', 'Flow2'], ['img34.jpg', 'Flow3'], ['img35.jpg', 'Flow4']
];

module.exports = function main() {
    const container = document.createElement('div');
    const title = document.createElement('div');
    const description = document.createElement('div');
    const choices = document.createElement('div');
    const currentBackground = Explorer.backgroundImage.get();
    container.className = 'personalization-section';
    title.className = 'personalization-section-title';
    description.className = 'personalization-section-description';
    choices.className = 'personalization-choice-grid';
    title.innerText = 'Choose your background';
    description.innerText = 'Select one of the built-in desktop backgrounds.';

    backgrounds.forEach(([fileName, label]) => {
        const imagePath = path.join('C:/Winbows/bg', fileName);
        const button = document.createElement('button');
        const preview = document.createElement('span');
        const text = document.createElement('span');
        button.type = 'button';
        button.className = 'personalization-choice';
        preview.className = 'personalization-choice-preview';
        text.className = 'personalization-choice-label';
        text.innerText = label;
        button.title = `Use ${label} as the desktop background`;
        if (currentBackground === imagePath) button.classList.add('selected');
        fs.downloadFile(imagePath).then(async buffer => { 
            const t = await createThumbnail(new Blob([buffer]));
            const url = URL.createObjectURL(t.blob);
            preview.style.backgroundImage = `url(${url})`; 
        });
        button.addEventListener('click', async () => {
            if (button.classList.contains('selected')) return;
            button.disabled = true;
            try {
                await Explorer.backgroundImage.set(imagePath);
                choices.querySelectorAll('.personalization-choice.selected').forEach(choice => choice.classList.remove('selected'));
                button.classList.add('selected');
            } finally { button.disabled = false; }
        });
        button.append(preview, text);
        choices.appendChild(button);
    });
    container.append(title, description, choices);
    return container;
};
