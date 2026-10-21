import requests

class PayPhoneAPI:
    def __init__(self, store_id: str, token: str):
        self.store_id = store_id
        self.token = token
        self.base_url = 'https://api.payphone.com.bo/payments'  # URL oficial PayPhone, revisar actual

    def crear_pago(self, monto: float, referencia: str, descripcion: str, telefono: str):
        """Crear una solicitud de pago."""
        url = f'{self.base_url}/create'
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        payload = {
            'storeId': self.store_id,
            'mount': round(monto, 2),
            'reference': referencia,
            'description': descripcion,
            'phoneNumber': telefono
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    def obtener_estado_pago(self, id_pago: str):
        """Consultar estado de pago."""
        url = f'{self.base_url}/status/{id_pago}'
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
