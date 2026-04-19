export const getRiskColor = (level) => {
  switch (level) {
    case 'high': return '#A4161A';
    case 'medium': return '#FFC300';
    case 'low': return '#15803d'; // Green-700
    default: return '#6b7280';
  }
};

export const getRiskBg = (level) => {
  switch (level) {
    case 'high': return '#fef2f2';
    case 'medium': return '#fffbeb';
    case 'low': return '#f0fdf4';
    default: return '#f9fafb';
  }
};

export const getRiskBorder = (level) => {
  switch (level) {
    case 'high': return '#fecaca';
    case 'medium': return '#fde68a';
    case 'low': return '#bbf7d0';
    default: return '#e5e7eb';
  }
};

export const getRiskLabel = (level) => {
  switch (level) {
    case 'high': return 'High Risk';
    case 'medium': return 'Medium Risk';
    case 'low': return 'Low Risk';
    default: return 'Unknown';
  }
};
