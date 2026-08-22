import StaffPageBase from '../components/staff/StaffPageBase';
import SupervisorsPageBase from '../components/supervisors/SupervisorsPageBase';
import { supervisors, supervisorRoles } from '../data/supervisors';

export default function Supervisors() {
  return (
    <SupervisorsPageBase
      pageTitle="Surveillants"
      entityLabel="un surveillant"
      initialData={supervisors}
      roleFieldKey="role"
      roleFieldLabel="Rôle"
      roleOptions={supervisorRoles}
    />
  );
}
