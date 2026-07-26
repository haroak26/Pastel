import { AppPage, ContentPanel } from '@/components/ds';
import { KnowledgeHeader } from './KnowledgeHeader';
import { KnowledgeContent } from '../content/KnowledgeContent';

interface KnowledgeLayoutProps {
  children?: React.ReactNode;
}

export function KnowledgeLayout({ children }: KnowledgeLayoutProps) {
  return (
    <AppPage>
      <ContentPanel header={<KnowledgeHeader />}>
        <div className="flex-1 min-w-0 flex flex-col">
          {children || <KnowledgeContent />}
        </div>
      </ContentPanel>
    </AppPage>
  );
}
