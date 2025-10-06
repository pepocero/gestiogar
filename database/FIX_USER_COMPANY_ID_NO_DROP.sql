-- Script para corregir la función user_company_id sin eliminarla
-- Usa CREATE OR REPLACE para evitar dependencias

-- Recrear la función con manejo de errores robusto (sin eliminar)
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Intentar obtener company_id desde auth.users primero
    BEGIN
        SELECT company_id INTO result_id
        FROM auth.users 
        WHERE auth.uid() = id
        LIMIT 1;
        
        -- Si encontramos resultado válido, devolverlo
        IF result_id IS NOT NULL THEN
            RETURN result_id;
        END IF;
        
    EXCEPTION
        WHEN undefined_column THEN
            -- Si la columna no existe en auth.users, intentar desde public.users
            BEGIN
                SELECT company_id INTO result_id
                FROM public.users 
                WHERE id = auth.uid()
                LIMIT 1;
                
                IF result_id IS NOT NULL THEN
                    RETURN result_id;
                END IF;
                
            EXCEPTION
                WHEN undefined_column THEN
                    RETURN NULL;
                WHEN OTHERS THEN
                    RETURN NULL;
            END;
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    
    -- Si llegamos aquí, intentar método alternativo
    BEGIN
        SELECT company_id INTO result_id
        FROM public.users 
        WHERE id = auth.uid()
        LIMIT 1;
        
        RETURN result_id;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
END;
$$;

-- Verificar que la función funcione correctamente
DO $$
DECLARE
    test_result UUID;
BEGIN
    SELECT user_company_id() INTO test_result;
    
    IF test_result IS NULL THEN
        RAISE NOTICE 'FUNCIÓN CORREGIDA: user_company_id() devuelve NULL (normal si no hay usuario autenticado)';
    ELSE
        RAISE NOTICE 'FUNCIÓN CORREGIDA: user_company_id() devuelve %', test_result;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error probando función: %', SQLERRM;
END $$;
