import { RiskFactor, RiskLevel } from '@eduguard/shared';

/**
 * Educational guidance engine generating supportive, non-punitive intervention suggestions.
 */
export function generateRecommendations(
  riskLevel: RiskLevel,
  predictedScore: number,
  riskFactors: RiskFactor[]
): string[] {
  const recommendations: string[] = [];

  // General risk level guidance
  if (riskLevel === 'HIGH') {
    recommendations.push(
      'Recommend early academic advising session with class advisor to discuss overall coursework challenges.'
    );
    recommendations.push(
      'Consider enrolling the student in dedicated peer tutoring or remedial tutorial sessions before midterm exams.'
    );
  } else if (riskLevel === 'MEDIUM') {
    recommendations.push(
      'Encourage regular check-ins during faculty office hours to review difficult topic comprehension.'
    );
  } else {
    recommendations.push(
      'Student is performing on track. Encourage continuous learning and participation in advanced topic seminars.'
    );
  }

  // Factor-specific recommendations
  for (const factor of riskFactors) {
    switch (factor.category) {
      case 'ATTENDANCE':
        recommendations.push(
          'Review attendance patterns with the student to identify and resolve timetable or commute constraints.'
        );
        break;
      case 'HISTORICAL_PERFORMANCE':
        recommendations.push(
          'Provide prerequisite refresher materials and diagnostic assessments for fundamental subject concepts.'
        );
        break;
      case 'INTERNAL_ASSESSMENT':
        recommendations.push(
          'Offer formative assessment retake opportunities or guided problem-solving workshops for upcoming internal tests.'
        );
        break;
      case 'ASSIGNMENT_COMPLETION':
        recommendations.push(
          'Establish a structured milestone submission calendar and provide assignment drafting guidelines.'
        );
        break;
      case 'STUDY_HABITS':
        recommendations.push(
          'Assist student in building a sustainable weekly study plan, balancing lecture hours with independent revision.'
        );
        break;
      case 'ENGAGEMENT':
        recommendations.push(
          'Encourage collaborative study groups and interactive laboratory participation to increase engagement.'
        );
        break;
    }
  }

  // Deduplicate and return at most 5 focused recommendations
  return Array.from(new Set(recommendations)).slice(0, 5);
}
