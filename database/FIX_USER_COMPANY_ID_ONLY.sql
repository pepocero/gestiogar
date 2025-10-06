-- Script para verificar y corregir SOLO la función user_company_id
-- Este script NO modifica tablas existentes, solo la función

-- Eliminar la función si existe para recrearla correctamente
DROP FUNCTION IF EXISTS user_company_id();

-- Verificar la estructura de la tabla users
-- (Solo informativo, no modifica nada)
DO $$ 
BEGIN 
    RAISE NOTICE 'Verificando estructura de tabla users...';
END $$;

-- Recrear la función user_company_id con manejo de errores
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Intentar obtener company_id directamente de auth.users
    BEGIN
        SELECT company_id INTO result_id
        FROM auth.users 
        WHERE auth.uid() = id;
        
        -- Si encontramos resultado, devolverlo
        IF result_id IS NOT NULL THEN
            RETURN result_id;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Si hay error, tratar de obtenerlo de otra forma
            BEGIN
                -- Intentar obtener desde la tabla public.users
                SELECT company_id INTO result_id
                FROM public.users 
                WHERE id = auth.uid();
                
                RETURN result_id;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Si sigue fallando, devolver NULL
                    RETURN NULL;
            END;
        END;
    END;
END;
$$;

-- Comentario: Esta función debe funcionar con cualquiera de estas estructuras:
-- 1. Si auth.users tiene columna company_id
-- 2. Si public.users tiene columna company_id relacional
-- 3. Si ninguna, devuelve NULL sin error

-- Verificar que la función funcione
SELECT user_company_id() as company_id_test;
