import { Link } from 'react-router-dom';
import type { LegalDocument } from '../../content/legal/types';

interface LegalArticleProps {
  doc: LegalDocument;
}

export default function LegalArticle({ doc }: LegalArticleProps) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-white">{doc.title}</h1>
      {doc.subtitle && <p className="text-gray-400 mt-2 text-sm">{doc.subtitle}</p>}
      <p className="text-gray-500 text-sm mt-2">
        {doc.lastUpdated}
      </p>

      <div className="mt-10 space-y-8">
        {doc.sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-white">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((p) => (
              <p key={p.slice(0, 40)} className="text-gray-300 text-sm leading-relaxed mt-3">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="list-disc pl-6 mt-3 space-y-1.5 text-gray-300 text-sm">
                {section.list.map((item) => (
                  <li key={item.slice(0, 50)}>{item}</li>
                ))}
              </ul>
            )}
            {section.links && (
              <ul className="mt-3 space-y-1 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('/') ? (
                      <Link to={link.href} className="text-purple-400 hover:underline">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
