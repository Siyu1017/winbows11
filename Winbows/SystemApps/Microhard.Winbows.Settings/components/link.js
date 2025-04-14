import { router } from "../_router.js";

export function Link() {
    const link = document.createElement('div');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
            router.push(href);
        }
    })
    return link;
}