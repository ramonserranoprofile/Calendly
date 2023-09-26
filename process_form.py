import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, redirect, url_for
from decouple import config

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', success_message=None)

@app.route('/process_form', methods=['GET', 'POST'])
def procesar_formulario():
    
    if request.method == 'POST':    
        name = request.form['name']
        email = request.form['email']
        message = request.form['message']
        
        # Accede a las variables de entorno
        gmail_user = str(config('GMAIL_USERNAME'))
        gmail_password = str(config('GMAIL_PASSWORD'))
        
        # Datos del servidor SMTP
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = gmail_user
        smtp_password = gmail_password
        
        # Datos del formulario
        # name = input('Name: ')
        # email = input('Email: ')
        # message = input('Message: ')

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
            print('Mail sent successfully')
        except Exception as e:
            print(f'Error to send email: {str(e)}')
    print('Formulario enviado correctamente')
        
    return redirect('/#contact-title')

if __name__ == '__main__':
    app.run(debug=True)