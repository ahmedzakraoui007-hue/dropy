import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/seller/dashboard'

  if (code) {
    const supabase = await createClient()

    // Échanger le code contre une session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${origin}/login?error=oauth_error`)
    }

    if (user) {
      // CORRECTION: Vérifier si un profil seller existe déjà
      const { data: existingProfile } = await supabase
        .from('seller_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        // Profil existe - vérifier le statut
        if (existingProfile.status === 'active') {
          // ✅ Compte actif → Dashboard
          return NextResponse.redirect(`${origin}/seller/dashboard`)
        } else if (existingProfile.status === 'pending') {
          // ⏳ En attente → Page d'attente
          return NextResponse.redirect(`${origin}/seller/pending`)
        }
      } else {
        // Pas de profil seller - vérifier autres rôles ou créer
        // Vérifier supplier
        const { data: supplierProfile } = await supabase
          .from('supplier_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .single()

        if (supplierProfile) {
          if (supplierProfile.status === 'active') {
            return NextResponse.redirect(`${origin}/supplier/dashboard`)
          }
          return NextResponse.redirect(`${origin}/supplier/pending`)
        }

        // Vérifier creator
        const { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .single()

        if (creatorProfile) {
          if (creatorProfile.status === 'active') {
            return NextResponse.redirect(`${origin}/creator/dashboard`)
          }
          return NextResponse.redirect(`${origin}/creator/pending`)
        }

        // Aucun profil - rediriger vers sélection de rôle
        return NextResponse.redirect(`${origin}/onboarding/select-role`)
      }
    }
  }

  // Erreur par défaut
  return NextResponse.redirect(`${origin}/login?error=unknown`)
}
