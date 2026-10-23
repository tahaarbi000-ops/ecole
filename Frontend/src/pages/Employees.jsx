import EmployPageBase from '../components/Employes/EmployPageBase';
import {  employeeRoles, employeeStatuses } from '../data/employees';

export default function Employees() {
  return (
    <EmployPageBase
      pageTitle="الموظفون"
      entityLabel="الموظف"
      roleFieldKey="role"
      roleFieldLabel="الوظيفة"
      roleOptions={employeeRoles}
      statusOptions={employeeStatuses}
    />
  );
}
