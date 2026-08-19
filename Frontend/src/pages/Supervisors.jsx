import StaffPageBase from '../components/staff/StaffPageBase';
import { supervisors, supervisorRoles } from '../data/supervisors';

export default function Supervisors() {
  return (
    <StaffPageBase
      pageTitle="Surveillants"
      entityLabel="un surveillant"
      initialData={supervisors}
      roleFieldKey="role"
      roleFieldLabel="Rôle"
      roleOptions={supervisorRoles}
    />
  );
}
