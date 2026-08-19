import AbsenceRolePage from '../../components/register/AbsenceRolePage';
import { absencesEleves } from '../../data/register';
import { levels } from '../../data/school';

export default function AbsenceEleves() {
  return (
    <AbsenceRolePage
      personLabel="Élève"
      initialData={absencesEleves}
      secondaryFieldKey="niveau"
      secondaryFieldLabel="Niveau"
      secondaryOptions={levels}
    />
  );
}
