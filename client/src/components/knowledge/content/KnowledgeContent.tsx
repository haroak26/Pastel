import { useKnowledge } from '../KnowledgeContext';
import { KnowledgeHome } from './KnowledgeHome';
import { ListSkeleton } from '@/components/ds';

export function KnowledgeContent() {
  const { isLoading } = useKnowledge();

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <ListSkeleton rows={8} />
      </div>
    );
  }

  return <KnowledgeHome />;
}
