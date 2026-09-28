import documentation from '../content/official-documentation.json';
import './official-docs.css';

export function OfficialDocs({chapterId,day}){
  const terms=documentation.terms.filter(term=>chapterId?term.chapterIds?.includes(chapterId):term.days?.includes(day));
  const sources=[...new Map(terms.flatMap(term=>term.sources).map(source=>[source.url,source])).values()];
  if(!sources.length)return null;
  return <details className="official-docs">
    <summary>Official documentation</summary>
    <p>Read the original documentation for the concepts in this lesson. The teaching examples may simplify how the production tools work.</p>
    <ul>{sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul>
    <a href="/reference/glossary">Glossary and sources →</a>
    <small>Links checked {documentation.checkedOn}</small>
  </details>;
}
