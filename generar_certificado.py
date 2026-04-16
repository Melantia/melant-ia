import os
import getpass
import datetime
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography import x509
from cryptography.x509.oid import NameOID

def generar_certificado_seguro():
    print("="*60)
    print("  GENERADOR DE CERTIFICADOS MELANT IA (OFFLINE-FIRST)")
    print("="*60)

    # 1. Solicitar contraseña de forma segura (no se muestra en pantalla)
    password = getpass.getpass("Ingresa la contraseña para proteger la Clave Privada: ")
    if not password:
        print("Error: La contraseña no puede estar vacía.")
        return
    
    confirm_password = getpass.getpass("Confirma la contraseña: ")
    if password != confirm_password:
        print("Error: Las contraseñas no coinciden. Operación cancelada.")
        return

    password_bytes = password.encode('utf-8')

    print("\n[1/4] Generando par de claves RSA (4096 bits)... Esto puede tardar unos segundos.")
    # Generamos la clave privada RSA
    private_key = rsa.generate_private_key(
        public_exponent=65537, # Estándar de la industria (Fermat F4)
        key_size=4096,
    )

    print("[2/4) Construyendo la estructura del Certificado X.509...")
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "CO"),  # Código país
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Rural"), # Departamento
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Campo"), # Ciudad
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MELANT IA"), # Nombre App
        x509.NameAttribute(NameOID.COMMON_NAME, "melant-ia.local"), # Dominio o ID
    ])

    cert_builder = x509.CertificateBuilder()
    cert_builder = cert_builder.subject_name(subject)
    cert_builder = cert_builder.issuer_name(issuer) # Auto-firmado
    cert_builder = cert_builder.public_key(private_key.public_key())
    cert_builder = cert_builder.serial_number(x509.random_serial_number())
    
    # Validez del certificado (Ejemplo: 3 años)
    cert_builder = cert_builder.not_valid_before(datetime.datetime.utcnow())
    cert_builder = cert_builder.not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=1095)
    )

    # Añadir extensiones de uso básico
    cert_builder = cert_builder.add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    )
    cert_builder = cert_builder.add_extension(
        x509.KeyUsage(
            digital_signature=True, key_encipherment=True, content_commitment=True,
            data_encipherment=False, key_agreement=False, key_cert_sign=False,
            crl_sign=False, encipher_only=False, decipher_only=False
        ), critical=True,
    )

    print("[3/4] Firmando el certificado con SHA-256...")
    certificate = cert_builder.sign(private_key, hashes.SHA256())

    # Directorio de salida
    cert_dir = "certificados"
    os.makedirs(cert_dir, exist_ok=True)

    # 4. Serializar y guardar en archivos PEM
    print("[4/4] Guardando archivos en la carpeta /certificados...")
    
    # Guardar Clave Privada (Encriptada con la contraseña)
    private_pem_path = os.path.join(cert_dir, "melant_private_key.pem")
    with open(private_pem_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(password_bytes)
        ))

    # Guardar Certificado Público (Sin contraseña, es público)
    public_pem_path = os.path.join(cert_dir, "melant_cert.pem")
    with open(public_pem_path, "wb") as f:
        f.write(certificate.public_bytes(
            encoding=serialization.Encoding.PEM
        ))

    print("\n" + "="*60)
    print("  ¡CERTIFICADOS GENERADOS EXITOSAMENTE!")
    print("="*60)
    print(f"📁 Clave Privada (PROTEGIDA): {private_pem_path}")
    print(f"📁 Certificado Público:       {public_pem_path}")
    print("\n⚠️  IMPORTANTE: No compartas la clave privada. El archivo .pem")
    print("    del certificado sí puede ser integrado en la app móvil/web.")
    print("    Para firmar datos en tu app, usa la contraseña que creaste.\n")

if __name__ == "__main__":
    generar_certificado_seguro()