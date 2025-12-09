# 📧 Plantillas de Email para Supabase

## Configuración en Supabase

### 1. Acceder a Email Templates

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **Authentication** en el menú lateral
3. Click en **Email Templates**

### 2. Configurar la plantilla "Confirm Signup"

1. Selecciona **"Confirm signup"** en la lista de plantillas
2. Copia el contenido del archivo `confirm_signup.html`
3. Pégalo en el editor de Supabase
4. Click en **Save**

### 3. Variables disponibles en Supabase

Las plantillas de email de Supabase soportan las siguientes variables:

- `{{ .ConfirmationURL }}` - URL de confirmación de email
- `{{ .Token }}` - Token de confirmación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL de tu sitio
- `{{ .Email }}` - Email del usuario

### 4. Otras plantillas disponibles

Puedes crear plantillas similares para:

- **Invite User** - Invitar usuarios
- **Magic Link** - Login sin contraseña
- **Change Email Address** - Cambio de email
- **Reset Password** - Restablecer contraseña

### 5. Personalización

Actualiza los siguientes elementos en la plantilla:

1. **Logo**: Reemplaza el SVG con tu logo
2. **Enlaces del footer**: 
   - `https://tudominio.com` → Tu dominio real
   - `soporte@gestiogar.com` → Tu email de soporte
3. **Colores**: Los colores ya coinciden con tu app (azul #3b82f6)

### 6. Testing

Para probar la plantilla:

1. Registra un nuevo usuario en tu app
2. Revisa el email de confirmación
3. Verifica que los enlaces funcionen
4. Confirma que el diseño se vea bien en diferentes clientes de email

### 7. Diseño Responsive

La plantilla está optimizada para:

✅ Gmail (desktop y móvil)
✅ Outlook
✅ Apple Mail
✅ Otros clientes de email modernos

## 🎨 Características del Diseño

- ✅ Diseño moderno y profesional
- ✅ Colores consistentes con la app (#3b82f6)
- ✅ Responsive para móviles
- ✅ Botón grande y visible
- ✅ Información clara y estructurada
- ✅ Nota de seguridad incluida
- ✅ Footer con enlaces útiles

## 📝 Notas

- Los estilos están inline para compatibilidad con clientes de email
- El diseño usa gradientes y sombras modernas
- El botón tiene efecto hover (solo funciona en clientes de email que lo soporten)
- La plantilla es totalmente editable desde Supabase

---

**¡Tu plantilla de email está lista para usar!** 🚀
