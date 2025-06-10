import { router } from '../_router.js';

export default function main() {
    var home = document.createElement('div');
    home.innerHTML = 'Desktop';
    home.addEventListener('click', (e) => {
        router.push('C:/Users/Admin/Desktop');
    })
    return home;
}