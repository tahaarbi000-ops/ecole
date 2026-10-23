import StaffPageBase from '../components/staff/StaffPageBase';
import SupervisorsPageBase from '../components/supervisors/SupervisorsPageBase';
import { supervisorRoles, supervisorStatuses } from '../data/supervisors';

export default function Supervisors() {
  return (
    <SupervisorsPageBase
      pageTitle="المشرفون"
      entityLabel="مشرف"
      roleFieldKey="role"
      roleFieldLabel="الوظيفة"
      roleOptions={supervisorRoles}
      statusOptions={supervisorStatuses}
    />
  );
}
