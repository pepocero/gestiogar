# 🔧 CORRECCIÓN FORMULARIO ASEGURADORAS - ERROR Y EDITOR DE IMÁGENES

## ❓ **Problema Reportado:**
> "En el formulario de las aseguradoras, al agregar una, da error."
> "Además antes la foto de la aseguradora tenía el editor de imágenes que se usa en Técnicos."

**Error en consola:**
```
POST https://pbdsuhmwxqiwbpgyrhqt.supabase.co/rest/v1/insurance_companies?select=* 400 (Bad Request)
Error guardando aseguradora: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'policies' column of 'insurance_companies' in the schema cache"}
```

## ✅ **Problema Identificado y Solucionado:**

### **Problema:**
- ❌ **Campo inexistente** - El formulario tenía campo `policies` que no existe en la tabla
- ❌ **Editor faltante** - No tenía el editor de imágenes como técnicos
- ❌ **Campos faltantes** - Faltaban `portal_url` y `api_endpoint` de la tabla real
- ❌ **Error de BD** - Supabase rechazaba la inserción por campo inexistente

### **Solución Implementada:**
- ✅ **Campos corregidos** - Usando solo campos que existen en la tabla
- ✅ **Editor restaurado** - Mismo editor de imágenes que técnicos
- ✅ **Campos completos** - Todos los campos de la tabla incluidos
- ✅ **Funcionalidad completa** - Formulario funciona correctamente

## 🔧 **Cambios Realizados:**

### **1. Estructura de Tabla Verificada:**
```sql
CREATE TABLE insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    portal_url VARCHAR(255),        -- ✅ Campo real
    api_endpoint VARCHAR(255),     -- ✅ Campo real
    billing_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**❌ Campo que NO existe:** `policies`
**✅ Campos que SÍ existen:** `portal_url`, `api_endpoint`

### **2. Estado del Formulario Corregido:**
```typescript
const [form, setForm] = useState({
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  portal_url: '',        // ✅ Agregado
  api_endpoint: '',      // ✅ Agregado
  billing_terms: 30,
  is_active: true
  // ❌ policies: '' - Removido (no existe en BD)
})
```

### **3. Estados para Editor de Imágenes Agregados:**
```typescript
// Estados para editor de imágenes
const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
const [showImageEditor, setShowImageEditor] = useState(false)
```

### **4. Función de Selección con Editor:**
```typescript
const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB')
      return
    }
    
    // Abrir editor de imagen
    setSelectedImageFile(file)
    setShowImageEditor(true)
  }
}
```

### **5. Función de Guardado del Editor:**
```typescript
const handleImageEditorSave = (croppedImageBlob: Blob) => {
  // Convertir blob a File
  const croppedFile = new File([croppedImageBlob], 'insurance-logo.jpg', {
    type: 'image/jpeg'
  })
  
  setLogoFile(croppedFile)
  
  // Crear preview
  const reader = new FileReader()
  reader.onload = (e) => {
    setLogoPreview(e.target?.result as string)
  }
  reader.readAsDataURL(croppedFile)
  
  setShowImageEditor(false)
  setSelectedImageFile(null)
}
```

### **6. Campos del Formulario Actualizados:**
```typescript
<Input
  label="Dirección"
  name="address"
  value={form.address}
  onChange={handleInputChange}
/>

<Input
  label="Portal URL"
  name="portal_url"
  value={form.portal_url}
  onChange={handleInputChange}
  placeholder="https://portal.aseguradora.com"
/>

<Input
  label="API Endpoint"
  name="api_endpoint"
  value={form.api_endpoint}
  onChange={handleInputChange}
  placeholder="https://api.aseguradora.com"
/>
```

### **7. Operaciones de Base de Datos Corregidas:**

#### **Crear Nueva Aseguradora:**
```typescript
const { data, error } = await supabase
  .from('insurance_companies')
  .insert({
    company_id: company.id,
    name: form.name,
    contact_person: form.contact_person,
    email: form.email,
    phone: form.phone,
    address: form.address,
    portal_url: form.portal_url,        // ✅ Campo real
    api_endpoint: form.api_endpoint,    // ✅ Campo real
    billing_terms: form.billing_terms,
    is_active: form.is_active
  })
  .select()
```

#### **Actualizar Aseguradora:**
```typescript
const updateData: any = {
  name: form.name,
  contact_person: form.contact_person,
  email: form.email,
  phone: form.phone,
  address: form.address,
  portal_url: form.portal_url,        // ✅ Campo real
  api_endpoint: form.api_endpoint,    // ✅ Campo real
  billing_terms: form.billing_terms,
  is_active: form.is_active
}
```

### **8. Componente ImageEditor Agregado:**
```typescript
{/* Editor de imágenes */}
{showImageEditor && selectedImageFile && (
  <ImageEditor
    isOpen={showImageEditor}
    onClose={() => {
      setShowImageEditor(false)
      setSelectedImageFile(null)
    }}
    onSave={handleImageEditorSave}
    imageFile={selectedImageFile}
  />
)}
```

### **9. Import Agregado:**
```typescript
import { ImageEditor } from '@/components/ui/ImageEditor'
```

## 🎯 **Funcionalidades Restauradas:**

### **Editor de Imágenes:**
- ✅ **Selección de archivo** - Input file con validación
- ✅ **Editor visual** - Cropping y redimensionado
- ✅ **Preview** - Vista previa después del cropping
- ✅ **Validación** - Tipo de archivo y tamaño (2MB max)
- ✅ **Mismo comportamiento** - Idéntico a técnicos

### **Formulario Completo:**
- ✅ **Campos correctos** - Solo campos que existen en BD
- ✅ **Portal URL** - Campo para URL del portal de la aseguradora
- ✅ **API Endpoint** - Campo para endpoint de API
- ✅ **Validación** - Campos requeridos marcados
- ✅ **Placeholders** - Ejemplos de URLs válidas

### **Operaciones CRUD:**
- ✅ **Crear** - Insertar nueva aseguradora
- ✅ **Leer** - Cargar aseguradoras existentes
- ✅ **Actualizar** - Modificar aseguradora existente
- ✅ **Eliminar** - Borrar aseguradora
- ✅ **Multitenant** - Filtrado por company_id

## 📁 **Archivos Modificados:**

- `app/insurance/page.tsx` - Formulario corregido y editor restaurado
- `CORRECCION_FORMULARIO_ASEGURADORAS.md` - Documentación completa

## 🎉 **Resultado Final:**

### **Antes (Problema):**
- ❌ **Error 400** - Campo `policies` no existe en BD
- ❌ **Sin editor** - No tenía editor de imágenes
- ❌ **Campos faltantes** - Faltaban `portal_url` y `api_endpoint`
- ❌ **Funcionalidad limitada** - Solo campos básicos

### **Después (Solucionado):**
- ✅ **Sin errores** - Todos los campos existen en BD
- ✅ **Editor completo** - Mismo editor que técnicos
- ✅ **Campos completos** - Todos los campos de la tabla
- ✅ **Funcionalidad completa** - CRUD completo funcionando

### **Beneficios:**
- ✅ **Sin errores** - Formulario funciona correctamente
- ✅ **Editor visual** - Cropping y redimensionado de logos
- ✅ **Campos completos** - Portal URL y API Endpoint
- ✅ **Consistencia** - Misma funcionalidad que técnicos
- ✅ **Multitenant** - Aislamiento por empresa

---

**¡El formulario de aseguradoras ha sido corregido y el editor de imágenes restaurado! 📸✅**

**Error solucionado:** Campo `policies` inexistente removido
**Editor restaurado:** Misma funcionalidad que técnicos
