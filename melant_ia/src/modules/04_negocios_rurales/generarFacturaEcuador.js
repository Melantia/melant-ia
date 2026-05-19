// Cloud Function para facturación electrónica automática en Ecuador
const functions = require('firebase-functions');
const axios = require('axios');

exports.generarFacturaEcuador = functions.firestore
    .document('pagos/{pagoId}')
    .onCreate(async (snap, context) => {
        const datosPago = snap.data();

        // 1. Datos para la factura (estructura estándar Ecuador)
        const facturaBody = {
            receptor: {
                nombre: datosPago.nombreUsuario,
                identificacion: datosPago.cedulaRuc,
                tipoIdentificacion: datosPago.tipoIdentificacion || "05", // 05 cédula, 04 RUC
                correo: datosPago.email
            },
            detalles: [{
                codigo: "PRO-001",
                descripcion: "Suscripción Mensual MELANT Pro",
                cantidad: 1,
                precioUnitario: 6.09, // Precio sin IVA
                impuestos: [{ codigo: "2", tarifa: "15", baseImponible: 6.09 }]
            }]
        };

        // 2. Enviar a la API de facturación local
        try {
            const respuesta = await axios.post('https://tuproveedor.com', facturaBody, {
                headers: { 'Authorization': 'Bearer TU_API_KEY' }
            });
            console.log("Factura autorizada por el SRI:", respuesta.data.claveAcceso);
        } catch (error) {
            console.error("Error en el SRI:", error.response ? error.response.data : error);
        }
    });
