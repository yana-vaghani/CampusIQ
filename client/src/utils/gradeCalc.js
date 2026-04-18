export const calculateGrade = (total) => {
  if (total >= 80) return { grade: 'O', label: 'Outstanding', className: 'grade-o' };
  if (total >= 70) return { grade: 'A+', label: 'Excellent', className: 'grade-a-plus' };
  if (total >= 60) return { grade: 'A', label: 'Very Good', className: 'grade-a' };
  if (total >= 50) return { grade: 'B', label: 'Good', className: 'grade-b' };
  if (total >= 40) return { grade: 'C', label: 'Average', className: 'grade-c' };
  if (total >= 35) return { grade: 'P', label: 'Pass', className: 'grade-p' };
  return { grade: 'F', label: 'Fail', className: 'grade-f' };
};

export const calculateTotal = (mid, internal, endsem) => {
  return parseFloat(mid) + parseFloat(internal) + (parseFloat(endsem) / 2);
};

export const getGradeInsight = (mid, internal, currentTotal) => {
  const current = parseFloat(mid) + parseFloat(internal);
  const boundaries = [
    { grade: 'O', min: 80, label: 'Outstanding' },
    { grade: 'A+', min: 70, label: 'Excellent' },
    { grade: 'A', min: 60, label: 'Very Good' },
    { grade: 'B', min: 50, label: 'Good' },
    { grade: 'C', min: 40, label: 'Average' },
    { grade: 'P', min: 35, label: 'Pass' },
  ];

  const insights = [];
  for (const b of boundaries) {
    const neededEndSem = (b.min - current) * 2;
    if (neededEndSem > 0 && neededEndSem <= 100) {
      insights.push({
        grade: b.grade,
        label: b.label,
        neededEndSem: Math.ceil(neededEndSem),
        achievable: neededEndSem <= 100,
      });
    }
  }
  return insights;
};

export const GRADE_BOUNDARIES = [
  { grade: 'O', min: 80, max: 100, label: 'Outstanding' },
  { grade: 'A+', min: 70, max: 79, label: 'Excellent' },
  { grade: 'A', min: 60, max: 69, label: 'Very Good' },
  { grade: 'B', min: 50, max: 59, label: 'Good' },
  { grade: 'C', min: 40, max: 49, label: 'Average' },
  { grade: 'P', min: 35, max: 39, label: 'Pass' },
  { grade: 'F', min: 0, max: 34, label: 'Fail' },
];
