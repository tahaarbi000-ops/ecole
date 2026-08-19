import StaffPageBase from '../components/staff/StaffPageBase';
import { teachers, subjects, teacherStatuses } from '../data/teachers';

export default function Teachers() {
  return (
    <StaffPageBase
      pageTitle="Maîtres"
      entityLabel="un maître"
      initialData={teachers}
      roleFieldKey="matiere"
      roleFieldLabel="Matière"
      roleOptions={subjects}
      showStatus
      statusOptions={teacherStatuses}
    />
  );
}
