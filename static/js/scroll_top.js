function scrollToTop() {
    // Desplázate suavemente hacia la parte superior de la página
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Muestra u oculta el botón de volver arriba según el desplazamiento de la página
window.addEventListener('scroll', function () {
    const btnScrollToTop = document.getElementById('btnScrollToTop');

    if (window.scrollY > 100) { // Cambia este valor según tus preferencias
        btnScrollToTop.style.display = 'block';
    } else {
        btnScrollToTop.style.display = 'none';
    }
});

// Escuchar eventos de clic en enlaces con la clase "scroll-link"
document.querySelectorAll('.scroll-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
        event.preventDefault(); // Evitar el comportamiento predeterminado del enlace

        // Obtener el objetivo del enlace (ejemplo: "#portfolio-item-title-1")
        const targetId = this.getAttribute('href');

        // Obtener el desplazamiento personalizado de los datos del atributo "data-offset"
        const offset = parseInt(this.getAttribute('data-offset')) || 0;

        // Calcular la posición del objetivo restando el desplazamiento personalizado
        const targetElement = document.querySelector(targetId);
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

        // Desplazarse a la posición del objetivo
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth' // Opcional: animar el desplazamiento
        });
    });
});