-- FILE: supabase/migrations/YYYYMMDDHHMMSS_create_admission_automation.sql
-- This script sets up the entire automated workflow for creating an admission
-- record when an application is approved.

-- =================================================================
-- STEP 1: CREATE AND SYNC THE SEQUENCE FOR ADMISSION REFERENCES
-- =================================================================
-- This block ensures the admission reference sequence is created
-- and correctly synchronized with any existing data.
DO $$
DECLARE
  -- Variable to hold the highest existing reference number
  last_used_ref_num INTEGER;
BEGIN
  -- Find the highest number already used in the admissions table.
  -- The COALESCE ensures that if the table is empty, we start with 0.
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(admission_ref, '/', 6) AS INTEGER
      )
    ), 0) -- Default to 0 if no records exist
  INTO last_used_ref_num
  FROM public.admissions
  WHERE admission_ref LIKE 'R/JUG/ADM/01/%'; -- A general pattern to catch all

  -- Create the sequence if it doesn't exist, starting it at the next available number.
  -- The `format` function builds the dynamic SQL safely.
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS public.admission_ref_seq START WITH %s INCREMENT BY 1 CACHE 1',
    last_used_ref_num + 1
  );

  -- Optional, for logging/verification when you run the script manually:
  RAISE NOTICE 'Admission reference sequence is set up to start at %', last_used_ref_num + 1;
END;
$$;


-- =================================================================
-- STEP 2: CREATE THE HELPER AND TRIGGER FUNCTIONS
-- =================================================================

-- Function to generate a unique admission reference using the sequence.
-- This version is simpler, faster, and race-condition-proof.
CREATE OR REPLACE FUNCTION public.generate_admission_ref()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq_val INTEGER;
BEGIN
  -- Get the current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Atomically get the next unique number from our sequence
  next_seq_val := nextval('public.admission_ref_seq');
  
  -- Format the reference string
  RETURN 'R/JUG/ADM/01/' || current_year || '/' || LPAD(next_seq_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger function to handle an approved application.
CREATE OR REPLACE FUNCTION public.handle_approved_application()
RETURNS TRIGGER AS $$
DECLARE
  current_academic_session_id UUID;
  generated_admission_ref TEXT;
BEGIN
  -- Only run if status is changing TO 'APPROVED'
  IF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' THEN
    -- Find the active academic session
    SELECT id INTO current_academic_session_id
    FROM public.academic_sessions
    WHERE is_current = true
    LIMIT 1;

    -- Validate that a session was found
    IF current_academic_session_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create admission: No active academic session is set. Please mark a session as "is_current = true".';
    END IF;
    
    -- Idempotency Check: Insert only if an admission doesn't already exist.
    IF NOT EXISTS (
      SELECT 1
      FROM public.admissions
      WHERE user_id = NEW.user_id
      AND course_id = NEW.first_choice_course_id
      AND academic_session_id = current_academic_session_id
    ) THEN
      -- Generate the unique admission reference
      generated_admission_ref := public.generate_admission_ref();
      
      -- Insert the new admission record
      INSERT INTO public.admissions (
        user_id, 
        course_id, 
        academic_session_id, 
        status, 
        admission_ref
      )
      VALUES (
        NEW.user_id,
        NEW.first_choice_course_id,
        current_academic_session_id,
        'provisional',
        generated_admission_ref
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- STEP 3: CREATE THE TRIGGER ON THE APPLICATIONS TABLE
-- =================================================================

-- Drop the trigger first to ensure a clean re-creation
DROP TRIGGER IF EXISTS on_application_approved ON public.applications;

-- Create the trigger to fire after an application's status is updated.
CREATE TRIGGER on_application_approved 
  AFTER UPDATE OF status ON public.applications 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_approved_application();