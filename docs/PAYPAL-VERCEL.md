# PayPal en Vercel · SCP

La pantalla existente `/pagar.html` ya utiliza los endpoints `/api/paypal/*`. En Vercel, esos endpoints ahora se ejecutan como funciones de servidor y usan el catálogo fijo del repositorio; el importe nunca se acepta desde el navegador. Solo se aceptan servicios incluidos en LP-01. LP-02, custodia/escrow, membresías y Stripe Connect permanecen separados y no se activan con este cambio.

## Variables del proyecto

En Vercel → **Settings → Environment Variables**, configurar las cuatro variables para **Production** (y Preview solo si se quiere probar desde las URL de vista previa):

| Variable | Valor |
| --- | --- |
| `PAYPAL_CLIENT_ID` | Client ID de la aplicación PayPal existente de SCP |
| `PAYPAL_CLIENT_SECRET` | Secret de esa misma aplicación; solo en Vercel, nunca en GitHub, HTML ni mensajes |
| `PAYPAL_ENVIRONMENT` | `sandbox` durante las pruebas; `live` cuando se valide el cobro real |
| `PAYPAL_CHECKOUT_ENABLED` | `true` solo después de confirmar credenciales y entorno |

No crear otra cuenta PayPal ni otra aplicación si la cuenta empresarial ya tiene una aplicación de API reutilizable. Si las credenciales de la aplicación anterior no están disponibles, recuperarlas desde el panel oficial de PayPal; no se pueden extraer de la web ni de Supabase.

## Activación segura

1. Usar las credenciales **Sandbox** de la aplicación existente y `PAYPAL_ENVIRONMENT=sandbox`.
2. Establecer `PAYPAL_CHECKOUT_ENABLED=true` en Preview y completar una compra de prueba usando una cuenta compradora Sandbox. No usar una tarjeta o cuenta real en Sandbox.
3. Al verificar que el importe, el concepto y el abono llegan a la cuenta empresarial correcta, cambiar Production a las credenciales **Live** y `PAYPAL_ENVIRONMENT=live`.
4. Mantener `PAYPAL_CHECKOUT_ENABLED=true` en Production. Cada cambio de variables requiere un nuevo despliegue de Vercel.

La configuración existente en este proyecto de Vercel no contenía variables de entorno al revisarla. Por tanto, las funciones quedan protegidas y responden como desactivadas hasta que se añadan estas claves. No se ha sustituido ni borrado ninguna cuenta o clave.

## Alcance del pago actual

- PayPal Checkout captura un pago único al confirmar el comprador.
- La confirmación se consulta directamente a PayPal y se valida contra el artículo, importe y moneda del catálogo del servidor.
- El navegador usa una cookie `HttpOnly`, `Secure` en producción y `SameSite=Lax` para recuperar el pedido de esa sesión.
- Esto no es custodia de fondos: los importes se capturan en PayPal al completar el checkout. Para retenerlos y liberarlos más tarde hace falta el producto de pagos aprobado y configurado para ese flujo; este cambio no afirma ni habilita escrow.
