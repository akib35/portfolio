function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

export { formatDate, scrollToElement, toggleClass };