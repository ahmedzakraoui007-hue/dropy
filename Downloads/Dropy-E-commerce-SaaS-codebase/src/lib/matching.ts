import { createClient } from "@/lib/supabase/client";

interface MatchScore {
  creatorId: string;
  briefId: string;
  score: number; // 0-100
  reasons: string[];
}

export async function calculateMatchScore(
  creator: any,
  brief: any
): Promise<MatchScore> {
  let score = 0;
  const reasons: string[] = [];

  // 1. Spécialité (40 points)
  if (creator.specialties?.includes(brief.content_type)) {
    score += 40;
    reasons.push(`Spécialité: ${brief.content_type}`);
  }

  // 2. Localisation (20 points)
  if (brief.preferred_city && creator.city === brief.preferred_city) {
    score += 20;
    reasons.push(`Même ville: ${creator.city}`);
  }

  // 3. Budget (15 points)
  const creatorMinBudget = creator.min_project_budget || 0;
  if (brief.budget_max >= creatorMinBudget) {
    score += 15;
    reasons.push('Budget compatible');
  }

  // 4. Expérience (15 points)
  const totalProjects = creator.total_projects || 0;
  if (totalProjects >= 10) {
    score += 15;
    reasons.push(`${totalProjects} missions complétées`);
  } else if (totalProjects >= 5) {
    score += 10;
  } else if (totalProjects >= 1) {
    score += 5;
  }

  // 5. Réputation (10 points)
  if (creator.rating >= 4.8) {
    score += 10;
    reasons.push(`Note: ${creator.rating}⭐`);
  } else if (creator.rating >= 4.5) {
    score += 7;
  } else if (creator.rating >= 4.0) {
    score += 4;
  }

  return {
    creatorId: creator.id,
    briefId: brief.id,
    score: Math.min(score, 100),
    reasons
  };
}
