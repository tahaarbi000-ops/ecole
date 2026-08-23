import EmployPageBase from '../components/Employes/EmployPageBase';
import { employees, employeeRoles } from '../data/employees';

export default function Employees() {
  return (
    <EmployPageBase
      pageTitle="Employés"
      entityLabel="un employé"
      initialData={employees}
      roleFieldKey="role"
      roleFieldLabel="Rôle"
      roleOptions={employeeRoles}
    />
  );
}
