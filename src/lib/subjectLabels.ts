export interface SubjectLabelSource {
  name: string;
  code: string;
}

export interface EmployeeLabel {
  firstName: string;
  lastName: string;
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function resolveSubjectLabel(
  subject: SubjectLabelSource,
  officialSubjects: SubjectLabelSource[],
  employees: EmployeeLabel[] = [],
): SubjectLabelSource {
  if (!subject.code.startsWith('SUB-')) return subject;

  const subjectLabel = normalizeLabel(subject.name);
  const officialMatch = officialSubjects
    .filter((candidate) => subjectLabel.startsWith(normalizeLabel(candidate.name)))
    .sort((a, b) => normalizeLabel(b.name).length - normalizeLabel(a.name).length)[0];

  if (officialMatch) return officialMatch;

  let cleanedName = subject.name.replace(/\s+lieu\s*:.*$/i, '').trim();
  for (const employee of employees) {
    const fullName = `${employee.firstName} ${employee.lastName}`.trim();
    if (fullName.length < 5) continue;
    cleanedName = cleanedName.replace(new RegExp(`\\s+${escapeRegExp(fullName)}\\s*$`, 'i'), '').trim();
  }

  return { ...subject, name: cleanedName };
}