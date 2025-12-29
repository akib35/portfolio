// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').split('#')[1];
            const targetSection = document.querySelector(`#${targetId}`);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = this.getAttribute('href');
            }
        });
    });

    // Handle CV download
    const cvLink = document.querySelector('.cv-download');
    if (cvLink) {
        cvLink.addEventListener('click', function(e) {
            e.preventDefault();
            const cvPath = this.getAttribute('href');
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = cvPath;
            link.download = 'Akib_CV.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('year').textContent = new Date().getFullYear();
});