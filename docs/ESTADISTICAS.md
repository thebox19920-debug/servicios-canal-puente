# Estadísticas privadas

Panel /estadisticas.html, API /api/statistics. Identidad gestionada por Sites: requiere ID autenticado y correo verificado igual a STATISTICS_OWNER_EMAIL (secreto de servidor). No confiar en parámetros del navegador; anónimo 401, otra cuenta 403. No hay contraseñas ni tokens propios. El inicio de sesión no cambia el acceso público de la web.

Contador D1 atómico por día Europe/Madrid y ruta HTML canónica. No IP, identificadores, cookies, referrers, query strings ni datos de formularios. No mide personas únicas ni sesiones. Recargas cuentan; robots conocidos, prefetch, panel, checkout y la propietaria autenticada se excluyen. Los totales comienzan al desplegar; no se inventa historial. La tabla se crea mediante migración 0001. La caída de analítica no bloquea la navegación. Panel vacío muestra cero, nunca datos de ejemplo.
