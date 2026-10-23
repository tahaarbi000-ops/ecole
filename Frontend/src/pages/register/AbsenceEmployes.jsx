import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { employeeRoles } from '../../data/employees';

export default function AbsenceEmployes() {
  return (
    <AbsenceRolePage
      personLabel="الالموظف"
      secondaryFieldKey="role"
      secondaryFieldLabel="الوظيفة"
      searchFieldLabel="الموظفين"
      secondaryOptions={employeeRoles}
      personsEndpoint="/employ"
      personsMode="search"
      personsResponseKey="employs"
    />
  );
}