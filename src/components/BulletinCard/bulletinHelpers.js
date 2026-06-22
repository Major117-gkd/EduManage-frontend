export const getMentionColor = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return '#94a3b8';
  if (v >= 16) return '#059669';
  if (v >= 14) return '#10b981';
  if (v >= 10) return '#d97706';
  return '#dc2626';
};

export const getMentionBg = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return '#f1f5f9';
  if (v >= 16) return '#ecfdf5';
  if (v >= 14) return '#d1fae5';
  if (v >= 10) return '#fffbeb';
  return '#fef2f2';
};

export const getMention = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return 'N/A';
  if (v >= 16) return 'Très Bien';
  if (v >= 14) return 'Bien';
  if (v >= 12) return 'Assez Bien';
  if (v >= 10) return 'Passable';
  return 'Insuffisant';
};
