-- ============================================
-- STORED PROCEDURES PARA PLANIFICADOR ACADÉMICO
-- Ejecutar en Neon SQL Editor
-- ============================================

-- Stored Procedure 1: Datos del estudiante (primera pantalla)
-- Uso: SELECT * FROM get_student_info('17051235');
CREATE OR REPLACE FUNCTION get_student_info(cedula_param TEXT)
RETURNS TABLE (
    student_id TEXT,
    name TEXT,
    career TEXT,
    gpa NUMERIC(4,2),
    accumulated_credits INTEGER,
    semester INTEGER,
    status TEXT,
    subjects_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.studentid::TEXT AS student_id,
        p.studentname::TEXT AS name,
        p.program::TEXT AS career,
        REPLACE(p.averagegradepoints, ',', '.')::NUMERIC(4,2) AS gpa,
        p.accumulatedcredits::INTEGER AS accumulated_credits,
        REPLACE(p.semesterlocation, 'SE', '')::INTEGER AS semester,
        'Activo'::TEXT AS status,
        (SELECT COUNT(DISTINCT p2.subjectid)::INTEGER 
         FROM proyecciones p2 
         WHERE p2.studentid = cedula_param::INTEGER) AS subjects_count
    FROM proyecciones p
    WHERE p.studentid = cedula_param::INTEGER
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- Stored Procedure 2: Materias y secciones (pantallas 2 y 3)
-- Devuelve teorías y prácticas como materias separadas
-- Uso: SELECT * FROM get_student_subjects_with_sections('17051235');
CREATE OR REPLACE FUNCTION get_student_subjects_with_sections(cedula_param TEXT)
RETURNS TABLE (
    subject_id TEXT,
    subject_name TEXT,
    credits INTEGER,
    semester INTEGER,
    nrc TEXT,
    profesor TEXT,
    cupo INTEGER,
    inscritos INTEGER,
    disponibles INTEGER,
    lunes TEXT,
    martes TEXT,
    miercoles TEXT,
    jueves TEXT,
    viernes TEXT,
    sabado TEXT,
    domingo TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Secciones de TEORÍA
    SELECT 
        p.subjectid::TEXT AS subject_id,
        COALESCE(o.course_name, p.subjectname)::TEXT AS subject_name,
        COALESCE(NULLIF(o.uc_base, '')::INTEGER, p.subjectcredits) AS credits,
        REPLACE(o.course_semestre, 'SE', '')::INTEGER AS semester,
        o.ssbsect_crn::TEXT AS nrc,
        o.profesor::TEXT AS profesor,
        COALESCE(NULLIF(o.cupo, '')::INTEGER, 0) AS cupo,
        COALESCE(NULLIF(o.inscritos, '')::INTEGER, 0) AS inscritos,
        COALESCE(NULLIF(o.cupo, '')::INTEGER, 0) - COALESCE(NULLIF(o.inscritos, '')::INTEGER, 0) AS disponibles,
        o.lunes::TEXT AS lunes,
        o.martes::TEXT AS martes,
        o.miercoles::TEXT AS miercoles,
        o.jueves::TEXT AS jueves,
        o.viernes::TEXT AS viernes,
        o.sabado::TEXT AS sabado,
        o.domingo::TEXT AS domingo
    FROM proyecciones p
    INNER JOIN oferta o ON (
        o.ssbsect_subj_code || '-' || REPLACE(o.ssbsect_crse_numb, '''', '') = p.subjectid
    )
    WHERE p.studentid = cedula_param::INTEGER
      AND o.campus != '''004'''
    
    UNION ALL
    
    -- Secciones de PRÁCTICA (aparecen como materia separada)
    SELECT 
        -- Usar el código de práctica como subject_id (INFO-P2015)
        (o.ssbsect_subj_code || '-' || REPLACE(o.ssbsect_crse_numb, '''', ''))::TEXT AS subject_id,
        (COALESCE(o.course_name, p.subjectname))::TEXT AS subject_name,
        COALESCE(NULLIF(o.uc_base, '')::INTEGER, 0) AS credits,
        REPLACE(o.course_semestre, 'SE', '')::INTEGER AS semester,
        o.ssbsect_crn::TEXT AS nrc,
        o.profesor::TEXT AS profesor,
        COALESCE(NULLIF(o.cupo, '')::INTEGER, 0) AS cupo,
        COALESCE(NULLIF(o.inscritos, '')::INTEGER, 0) AS inscritos,
        COALESCE(NULLIF(o.cupo, '')::INTEGER, 0) - COALESCE(NULLIF(o.inscritos, '')::INTEGER, 0) AS disponibles,
        o.lunes::TEXT AS lunes,
        o.martes::TEXT AS martes,
        o.miercoles::TEXT AS miercoles,
        o.jueves::TEXT AS jueves,
        o.viernes::TEXT AS viernes,
        o.sabado::TEXT AS sabado,
        o.domingo::TEXT AS domingo
    FROM proyecciones p
    INNER JOIN oferta o ON (
        -- Match práctica: INFO-P2015 para INFO-02015
        o.ssbsect_subj_code || '-' || REPLACE(o.ssbsect_crse_numb, '''', '') = 
            SUBSTRING(p.subjectid, 1, POSITION('-' IN p.subjectid)) || 'P' || SUBSTRING(p.subjectid, POSITION('-' IN p.subjectid) + 2)
    )
    WHERE p.studentid = cedula_param::INTEGER
      AND o.campus != '''004'''
    
    ORDER BY subject_id, nrc;
END;
$$ LANGUAGE plpgsql;
