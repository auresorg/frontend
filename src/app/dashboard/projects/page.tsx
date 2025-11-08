import EntityTable from '@/components/ui/dashboard/EntityTable';
import { ENTITY_CONFIGS } from '@/lib/entityConfig';

export default function ProjectsPage() {
  return <EntityTable config={ENTITY_CONFIGS.project} />;
}