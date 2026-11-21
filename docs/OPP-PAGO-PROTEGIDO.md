# LP-02 · OPP: pago íntegro protegido

Estado: especificación implementada, integración real pendiente. LP-01 y suscripciones conservan PayPal.

El paciente paga el 100 %. El proveedor retiene todo el importe, incluida la comisión de LEXPUENTE, hasta finalizar el tratamiento, verificar la revisión clínica y recibir confirmación explícita del paciente. No hay anticipos, liberaciones parciales ni conformidad por silencio. Una incidencia bloquea el pago. Un odontólogo verifica la documentación clínica; no un detector automático ni personal no sanitario.

Plazo previsto máximo estándar: 365 días desde el pago, sujeto a aprobación de OPP para el sector sanitario y la operación. El vencimiento exige resolución previa (extensión autorizada u otra solución pactada), nunca pago automático o retención indefinida. Confirmar contrato, costes, reservas, comisiones en devoluciones, contracargos, permisos para manejar datos sanitarios y obligaciones asistenciales de las clínicas antes de activar.

`/api/opp/config` publica el estado inactivo y la política. Todos los demás endpoints OPP responden 503: no existe todavía adaptador de cobro/liberación ni webhook OPP. `oppReleaseEligible` expresa los requisitos internos; jamás autoriza por sí solo una transferencia. Los estados y pruebas deben proceder de registros verificados en servidor, nunca del JSON del navegador. Integración futura: aprobar cuenta, claves seguras, checkout alojado, verificar importe/moneda y eventos firmados, almacenamiento, conciliación, panel privado, confirmación autenticada, incidencias y liberación idempotente. No pedir radiografías por formularios públicos ni WhatsApp.

Los servicios externos siguen en consulta de presupuesto; no redirigirlos a Stripe ni PayPal. El seguro complementario no está contratado y no se anuncia como cobertura activa.

## Plazos operativos pactados
Curetajes: 48 h desde servicio realizado. Extracciones: 168 h desde servicio realizado. Implantes: tratamiento finalizado con corona colocada + 168 h. Confirmación del paciente posterior al plazo; revisión clínica fechada tras el evento; incidencia bloquea. No son protocolos médicos ni garantía de curación. Otros servicios requieren reglas específicas; elegibilidad denegada sin regla.
PL01 y PL02 son alias internos de los códigos existentes LP-01 y LP-02; se preservan referencias y colores aprobados. El cobro propio PayPal es directo: la disponibilidad y la transferencia bancaria dependen del proveedor, sin promesa de ingreso bancario instantáneo.
