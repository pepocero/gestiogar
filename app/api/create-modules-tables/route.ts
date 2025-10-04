import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar si las tablas ya existen
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['modules', 'module_data'])

    if (checkError) {
      console.error('Error checking existing tables:', checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    const existingTableNames = existingTables?.map(t => t.table_name) || []
    
    if (existingTableNames.includes('modules') && existingTableNames.includes('module_data')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Las tablas de módulos ya existen' 
      })
    }

    // Si las tablas no existen, devolver instrucciones para crearlas manualmente
    return NextResponse.json({ 
      success: false, 
      error: 'Las tablas modules y module_data no existen. Por favor, ejecuta el SQL de creación en Supabase Dashboard.',
      instructions: `
        Ejecuta este SQL en Supabase Dashboard > SQL Editor:
        
        -- Crear tabla de módulos
        CREATE TABLE IF NOT EXISTS public.modules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            description TEXT,
            icon VARCHAR(100) DEFAULT 'Package',
            is_active BOOLEAN DEFAULT true,
            config JSONB DEFAULT '{}',
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(company_id, slug)
        );

        -- Crear tabla de datos de módulos
        CREATE TABLE IF NOT EXISTS public.module_data (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
            data JSONB DEFAULT '{}',
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
        CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
        CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);

        -- Habilitar RLS
        ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

        -- Crear función user_company_id si no existe
        CREATE OR REPLACE FUNCTION user_company_id()
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN (
            SELECT company_id 
            FROM auth.users 
            WHERE auth.uid() = id
          );
        END;
        $$;

        -- Políticas para modules
        CREATE POLICY "Users can view their company modules" ON public.modules
            FOR SELECT USING (company_id = user_company_id());

        CREATE POLICY "Users can create modules for their company" ON public.modules
            FOR INSERT WITH CHECK (company_id = user_company_id());

        CREATE POLICY "Users can update their company modules" ON public.modules
            FOR UPDATE USING (company_id = user_company_id());

        CREATE POLICY "Users can delete their company modules" ON public.modules
            FOR DELETE USING (company_id = user_company_id());

        -- Políticas para module_data
        CREATE POLICY "Users can view their company module data" ON public.module_data
            FOR SELECT USING (company_id = user_company_id());

        CREATE POLICY "Users can create module data for their company" ON public.module_data
            FOR INSERT WITH CHECK (company_id = user_company_id());

        CREATE POLICY "Users can update their company module data" ON public.module_data
            FOR UPDATE USING (company_id = user_company_id());

        CREATE POLICY "Users can delete their company module data" ON public.module_data
            FOR DELETE USING (company_id = user_company_id());
      `
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error checking modules tables:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
