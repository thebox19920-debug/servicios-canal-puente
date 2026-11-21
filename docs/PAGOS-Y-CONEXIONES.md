# LEXPUENTE: pagos, membresías y conexiones

Estado: servicios propios y suscripciones conservan PayPal. LP-02 prevé OPP con retención íntegra; cobros y liberaciones pendientes de aprobación e integración.

## Servicios propios y mixtos
El catálogo PayPal cobra exclusivamente las prestaciones propias descritas en cada ficha. Un servicio mixto debe tener dos conceptos separados: honorarios propios de coordinación y honorarios del profesional. No modificar silenciosamente el proveedor o la naturaleza de un producto ya vendido.

## OPP / Escudo Triple: modelo vigente previsto
Proveedor LP-02: OPP. Retención del 100 % hasta tratamiento finalizado, revisión clínica verificada y confirmación explícita del paciente, sin incidencias abiertas. Sin anticipos, hitos parciales ni liberación por silencio. La comisión de LEXPUENTE permanece retenida hasta el pago final. Máximo estándar previsto 365 días desde el cobro, sujeto a autorización y contrato de OPP. Resolver cualquier vencimiento antes de la fecha límite; no liberar por calendario.

La aprobación y conexión con OPP aún no existen. `/api/opp/config` declara `enabled:false`; todas las operaciones de cobro, liberación y webhook OPP responden 503. La función de elegibilidad es una especificación comprobada, no una integración bancaria operativa. Las rutas Stripe antiguas permanecen cerradas. Véase `OPP-PAGO-PROTEGIDO.md` para las piezas pendientes.

## Membresías: oferta aprobada y cobro propio por PayPal
Oferta aprobada por Boutaina el 14/11/2026: Tranquilidad 14,90 €/mes o 149 €/año (pago anual completo), dos consultas al mes de hasta 15 minutos, destinadas a orientación, dudas o seguimiento de un expediente. Profesional Plus 49 €/mes, una hora mensual de apoyo administrativo o agenda, incluida la creación y actualización de la ficha de presentación en la red. El tiempo no se acumula. Servicios puntuales y externos aparte. Sin descuentos ni atención ilimitada. Cancelación de próximas renovaciones conservando el periodo pagado.

Las tres modalidades se publican en /planes.html y llevan a /suscribirme?plan=<modalidad>. El cobro está desactivado por defecto. No se ha creado ni activado ningún plan real en PayPal. Ninguna membresía LEXPUENTE se cobra por Stripe. Los paquetes Clinic existentes siguen siendo compras puntuales por PayPal y no se convierten en recurrentes.

Configuración de servidor pendiente, mediante acceso seguro:
- PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET: cuenta empresarial del titular, nunca en el navegador o el repositorio.
- PAYPAL_ENVIRONMENT: sandbox durante las pruebas, live al activar después de la validación.
- PAYPAL_PLAN_TRANQUILIDAD_MONTH: ID real del plan mensual EUR 14,90.
- PAYPAL_PLAN_TRANQUILIDAD_YEAR: ID real del plan anual EUR 149,00.
- PAYPAL_PLAN_PROFESIONAL_MONTH: ID real del plan mensual EUR 49,00.
- PAYPAL_MEMBERSHIPS_WEBHOOK_ID: ID del webhook de la misma aplicación y entorno.
- PAYPAL_MEMBERSHIPS_ENABLED: true únicamente al completar configuración, validación comercial/fiscal y pruebas de proveedor.
- BUCKET: almacenamiento ya previsto.

Crear los productos/planes en PayPal con una única fase REGULAR, intervalo MONTH o YEAR según modalidad, interval_count 1, total_cycles 0, sin prueba gratuita, sin cuota de alta ni suplementos de impuestos no incluidos. Los precios publicados son los importes finales que valida el servidor; confirmar su tratamiento fiscal antes de activar cobros.

Webhook: POST /api/memberships/webhook. Eventos de ciclo de vida BILLING.SUBSCRIPTION.CREATED, ACTIVATED, UPDATED, CANCELLED, SUSPENDED, EXPIRED, PAYMENT.FAILED y PAYMENT.SALE.COMPLETED (más refunds/reversals para conciliación operativa). Verificación de firma mediante la API PayPal; registro idempotente. El estado se consulta de nuevo al proveedor para no aplicar un evento antiguo como si fuera el actual. Las devoluciones y contracargos necesitan conciliación del administrador y no conceden derecho a servicios nuevos de manera automática.

El alta comprueba el plan del servidor, precio, moneda, periodicidad, cuotas y límites antes de crear la autorización. No acepta importes, ID de plan PayPal o URLs de retorno del navegador. La clave de idempotencia procede de la sesión y la modalidad; un doble clic o dos pestañas de la misma modalidad no deben producir dos altas dentro de la ventana de idempotencia del proveedor. No se activa el servicio por visitar la URL de retorno: requiere estado y pago verificados en PayPal.

Gestión en el navegador con cookie HttpOnly/Secure/SameSite=Lax. Cancelación explícita de renovaciones con conservación del periodo pagado comprobado. Si se pierde la cookie, gestión en la cuenta PayPal del comprador o recuperación con soporte previa verificación. No existe aún un área privada multidispositivo. La asignación de citas, consumo de minutos, publicación de fichas profesionales y conciliación de devoluciones se gestionarán operativamente por LEXPUENTE; no se anuncian como automatizaciones ya disponibles.

Endpoints /api/memberships/config, create, status, cancel y webhook. Las rutas antiguas de suscripción Stripe están deshabilitadas.

## Redes oficiales
Completar exclusivamente URLs verificadas en web/assets/social-links.json. Plataformas preparadas: Instagram, Facebook, LinkedIn, TikTok, YouTube y WhatsApp. Los perfiles vacíos no generan enlaces rotos. Solo HTTPS y dominios permitidos; WhatsApp mantiene el contacto existente. Los enlaces se presentan en los pies de página con apertura segura. No se cargan widgets de seguimiento externos. Si se añaden feeds embebidos, requerir consentimiento previo y alternativa accesible; la publicación automática necesita además permisos y autenticación de cada red.

## Asociación y protección animal
Menú completo en escritorio y móvil. Imagen ilustrativa generada para la futura iniciativa, no prueba de rescates realizados. No se han habilitado donaciones ni presentado la asociación como constituida.

## Fuentes técnicas
- https://docs.stripe.com/connect/manual-payouts
- https://docs.stripe.com/connect/separate-charges-and-transfers
- https://docs.stripe.com/payments/checkout/build-subscriptions
- https://docs.stripe.com/webhooks/signature
