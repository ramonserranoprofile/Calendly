import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, redirect, url_for, jsonify
import requests
from decouple import config
import logging

app = Flask(__name__)

# Configurar el sistema de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verificar_hcaptcha(response):
    secret_key = str(config('HCAPTCHA_SECRET_KEY'))
    verification_url = f"https://hcaptcha.com/siteverify?secret={secret_key}&response={response}"
    verification_result = requests.post(verification_url)
    data = verification_result.json()
    return data.get('success', False)


@app.route('/')
def index():
    return render_template('index.html') 
    # , success_message=None)


@app.route('/process_form', methods=['POST'])
def procesar_formulario():
    name = request.form['name']
    email = request.form['email']
    message = request.form['message']
    h_captcha_response = request.form.get('h-captcha-response')

    # Verificar hCaptcha
    # Verificar hCaptcha
    if verificar_hcaptcha(h_captcha_response):
        # Accede a las variables de entorno
        gmail_user = str(config('GMAIL_USERNAME'))
        gmail_password = str(config('GMAIL_PASSWORD'))

        # Datos del servidor SMTP
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = gmail_user
        smtp_password = gmail_password

        # Crear mensaje de correo
        msg = MIMEMultipart()
        msg['From'] = email
        msg['To'] = smtp_user
        msg['Subject'] = f'New contact message from {name}'

        body = f'Name: {name}\nEmail: {email}\nMessage: {message}'
        msg.attach(MIMEText(body, 'plain'))

        # Conectar al servidor SMTP y enviar correo
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, smtp_user, msg.as_string())
            server.quit()
            logger.info('Mail sent successfully')
            return render_template('index.html', success_message='Mail sent successfully.', error_message=None, scrollTo='#contact-title')
        except Exception as e:
            logger.error(f'Error to send email: {str(e)}')

        logger.info('Formulario enviado correctamente')
        # return jsonify({'success': 'Formulario enviado correctamente.'}), 200
        return render_template('index.html', success_message='Formulario enviado correctamente.', error_message=None, scrollTo='#contact-title')
    else:
        logger.warning('Error: Por favor, verifica que eres humano.')
        # return jsonify({'error': 'Error: Por favor, verifica que eres humano.'}), 400
        return render_template('index.html', success_message=None, error_message='Error: Por favor, verifica que eres humano.', scrollTo='#contact-title')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=(config('PUERTO_FLASK')))
