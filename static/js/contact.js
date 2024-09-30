const form = document.getElementById('contact-form');
if (form) {
    form.addEventListener('submit', async function (event) {
        event.preventDefault();  // Evita el comportamiento por defecto del formulario

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries()); // Convierte FormData a objeto

        console.log("Sending data: ", JSON.stringify(data));

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data), // Envía el objeto serializado
            });

            const result = await response.json(); // Espera un objeto JSON

            // Muestra el mensaje de respuesta
            const responseMessage = document.getElementById('responseMessage');
            responseMessage.innerHTML = result.message; // Asegúrate de que esto esté bien

            if (response.ok) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Mail Sent Successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                form.reset();
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Something went wrong!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            document.getElementById('responseMessage').innerHTML = `<p style="color: red;">Something went wrong: ${error.message}</p>`;
        }
    });
} else {
    console.error('Element with ID "contact-form" not found.');
}
