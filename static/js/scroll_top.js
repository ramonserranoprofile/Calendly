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