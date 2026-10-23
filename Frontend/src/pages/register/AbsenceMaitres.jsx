import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { subjects } from '../../data/teachers';

export default function AbsenceMaitres() {
  return (
    <AbsenceRolePage
      personLabel="المعلمون"
      secondaryFieldKey="matiere"
      secondaryFieldLabel="مواد"
      searchFieldLabel="المواد"
      secondaryOptions={subjects}
      personsEndpoint="/teacher"
      personsMode="search"
      personsResponseKey="teachers"
    />
  );
}