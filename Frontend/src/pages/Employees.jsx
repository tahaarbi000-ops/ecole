import EmployPageBase from '../components/Employs/EmployPageBase';
import StaffPageBase from '../components/staff/StaffPageBase';
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
