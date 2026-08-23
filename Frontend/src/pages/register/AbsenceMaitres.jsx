import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { absencesMaitres } from '../../data/register';
import { subjects } from '../../data/teachers';

export default function AbsenceMaitres() {
  return (
    <AbsenceRolePage
      personLabel="Maître"
      initialData={absencesMaitres}
      secondaryFieldKey="matiere"
      secondaryFieldLabel="Matière"
      secondaryOptions={subjects}
      personsEndpoint="/teacher"
      personsMode="search"
      personsResponseKey="teachers"
    />
  );
}