import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { levels } from '../../data/school';

export default function AbsenceEleves() {
  return (
    <AbsenceRolePage
      personLabel="تلميذ"
      secondaryFieldKey="niveau"
      secondaryFieldLabel="القسم"
      searchFieldLabel="الاقسام"
      secondaryOptions={levels}
      personsEndpoint="/student"
      personsMode="students"
      personsResponseKey="students"
    />
  );
}