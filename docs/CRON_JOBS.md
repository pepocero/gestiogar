# Configuración de Cron Jobs para Verificación de Suscripciones Expiradas

Este documento explica cómo configurar el cron job que verifica y actualiza automáticamente las suscripciones expiradas.

## ¿Qué hace el cron job?

El cron job verifica diariamente todas las suscripciones y actualiza automáticamente:
- `subscription_plan` → `'free'`
- `subscription_status` → `'expired'`

Cuando una suscripción ha pasado su fecha de expiración (`subscription_ends_at`).

## Configuración en Vercel (Recomendado)

Si estás usando Vercel, el cron job ya está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/subscriptions/check-expired",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Horario**: Se ejecuta diariamente a las 2:00 AM UTC.

### Pasos para activar en Vercel:

1. Asegúrate de que el archivo `vercel.json` esté en la raíz del proyecto
2. Despliega el proyecto en Vercel
3. Vercel detectará automáticamente el cron job y lo activará
4. Puedes verificar el estado en el dashboard de Vercel → Settings → Cron Jobs

## Configuración en otros servicios

### Opción 1: Servicio de Cron Jobs Externo (cron-job.org, EasyCron, etc.)

1. Crea una cuenta en un servicio de cron jobs (ej: https://cron-job.org)
2. Configura una nueva tarea:
   - **URL**: `https://tu-dominio.com/api/subscriptions/check-expired`
   - **Método**: GET
   - **Frecuencia**: Diario a las 2:00 AM
   - **Headers** (opcional): `Authorization: Bearer TU_CRON_SECRET`

3. Si configuraste `CRON_SECRET` en las variables de entorno, agrega el header de autorización

### Opción 2: Usar un servicio de monitoreo (UptimeRobot, Pingdom, etc.)

1. Configura un monitor HTTP que llame al endpoint diariamente
2. URL: `https://tu-dominio.com/api/subscriptions/check-expired`
3. Método: GET
4. Frecuencia: Cada 24 horas

### Opción 3: Script local con cron (Linux/Mac)

Si tienes acceso al servidor, puedes crear un script:

```bash
#!/bin/bash
curl -X GET "https://tu-dominio.com/api/subscriptions/check-expired" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Y agregarlo al crontab:
```bash
0 2 * * * /ruta/al/script.sh
```

## Variables de Entorno

### CRON_SECRET (Opcional pero recomendado)

Para mayor seguridad, puedes configurar una variable de entorno `CRON_SECRET`:

```env
CRON_SECRET=tu_secreto_super_seguro_aqui
```

Si configuras esta variable, el endpoint requerirá el header:
```
Authorization: Bearer tu_secreto_super_seguro_aqui
```

**Sin CRON_SECRET**: El endpoint solo acepta llamadas desde Vercel Cron (con header `x-vercel-cron: 1`)

## Verificación Manual

Puedes verificar manualmente el endpoint:

```bash
# Verificar todas las suscripciones
curl https://tu-dominio.com/api/subscriptions/check-expired

# Verificar una empresa específica
curl "https://tu-dominio.com/api/subscriptions/check-expired?companyId=UUID_DE_LA_EMPRESA"
```

## Respuesta del Endpoint

El endpoint retorna:

```json
{
  "success": true,
  "updated": 3,
  "errors": 0,
  "message": "Updated 3 expired subscriptions",
  "timestamp": "2025-01-15T02:00:00.000Z"
}
```

## Verificación en Tiempo Real

Además del cron job, el sistema también verifica automáticamente cuando:
- Un usuario inicia sesión
- Se carga el perfil del usuario

Esto asegura que las suscripciones se actualicen incluso si el cron job falla.

## Troubleshooting

### El cron job no se ejecuta

1. Verifica que `vercel.json` esté en la raíz del proyecto
2. Verifica que el endpoint esté desplegado correctamente
3. Revisa los logs en Vercel Dashboard → Functions → Cron Jobs

### Error 401 Unauthorized

- Si usas un servicio externo, asegúrate de configurar el header `Authorization: Bearer CRON_SECRET`
- O configura `CRON_SECRET` en las variables de entorno de Vercel

### Las suscripciones no se actualizan

1. Verifica que la fecha de expiración (`subscription_ends_at`) esté configurada correctamente
2. Verifica los logs del endpoint para ver si hay errores
3. Verifica que las empresas tengan `subscription_plan = 'pro'` o `subscription_status = 'cancelled'`

