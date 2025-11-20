-- Agregar campo onboarding_completed a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Índice para mejorar performance en queries de onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed) 
WHERE onboarding_completed = false;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica si el usuario ha completado el onboarding inicial';
