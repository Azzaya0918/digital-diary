// Supabase-ийн албан ёсны JavaScript сангийг (SDK) CDN-ээр дамжуулж ашиглах тохиргоо
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ⚠️ ЭНД ӨӨРИЙН Supabase төслийн URL болон Anon Key-г оруулна уу.
// Supabase Dashboard -> Project Settings -> API хэсгээс авна.
const SUPABASE_URL = "https://hhulxecpkzxxtfwglfez.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodWx4ZWNwa3p4eHRmd2dsZmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODcwNjUsImV4cCI6MjEwNjA2MzA2NX0.o_tOs5otGTpn7gGNwrGM3AMDX281Mbwm1y65Nc46mM4"

// Supabase клиентийг үүсгэж, экспортлох
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
