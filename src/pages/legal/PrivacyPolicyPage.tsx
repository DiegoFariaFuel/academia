import PublicLayout from '../../components/public/PublicLayout';
import LegalArticle from '../../components/legal/LegalArticle';
import { getLegalDocument } from '../../content/legal';
import { useLegalLocale } from '../../hooks/useLegalLocale';

export default function PrivacyPolicyPage() {
  const locale = useLegalLocale();
  const doc = getLegalDocument('privacy', locale);

  return (
    <PublicLayout>
      <LegalArticle doc={doc} />
    </PublicLayout>
  );
}
