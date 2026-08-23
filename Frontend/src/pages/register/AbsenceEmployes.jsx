import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { absencesEmployes } from '../../data/register';
import { employeeRoles } from '../../data/employees';

export default function AbsenceEmployes() {
  return (
    <AbsenceRolePage
      personLabel="Employé"
      initialData={absencesEmployes}
      secondaryFieldKey="role"
      secondaryFieldLabel="Rôle"
      secondaryOptions={employeeRoles}
      personsEndpoint="/employ"
      personsMode="search"
      personsResponseKey="employs"
    />
  );
}