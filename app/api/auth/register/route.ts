import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!

// Crear cliente admin en el servidor (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Función para generar slug único
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      companyTaxId,
      firstName,
      lastName,
      email,
      password,
      phone
    } = body

    // Validaciones
    if (!companyName || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Generar slug único
    const slug = await generateUniqueSlug(companyName)

    // 1. Crear la empresa usando el service role (bypass RLS)
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{
        name: companyName,
        slug,
        address: companyAddress || null,
        phone: companyPhone || null,
        email: companyEmail || null,
        website: companyWebsite || null,
        tax_id: companyTaxId || null,
      }])
      .select()
      .single()

    if (companyError) {
      console.error('[API] Error creating company:', companyError)
      return NextResponse.json(
        { error: 'Error al crear la empresa: ' + companyError.message },
        { status: 500 }
      )
    }

    // 2. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null
      }
    })

    if (authError) {
      // Si falla la creación del usuario, eliminar la empresa
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      console.error('[API] Error creating user:', authError)
      return NextResponse.json(
        { error: 'Error al crear el usuario: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      // Si no se creó el usuario, eliminar la empresa
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    // 3. Crear el perfil del usuario usando supabaseAdmin (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        company_id: company.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'owner',
      }])
      .select()
      .single()

    if (profileError) {
      // Si falla la creación del perfil, eliminar empresa y usuario
      console.error('[API] Error creating user profile:', profileError)
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Error al crear el perfil del usuario: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company,
      user: authData.user,
      profile
    })
  } catch (error: any) {
    console.error('[API] Error in register:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

