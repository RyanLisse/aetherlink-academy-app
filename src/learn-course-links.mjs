export const courseUrl=id=>`/?learn=${encodeURIComponent(id)}`;

// Resolve original Markdown links without turning omitted upstream files into local 404s.
export function resolveCourseLink(value,path,catalog){
  if(!value)return '';
  if(value.startsWith('#'))return value;
  if(/^(https?:|mailto:)/i.test(value))return value;
  if(value.startsWith('//'))return `https:${value}`;
  if(/^[a-z][a-z\d+.-]*:/i.test(value))return '';
  try{
    const url=new URL(value,`https://content.local/${path}`);
    const target=decodeURIComponent(url.pathname.slice(1));
    const index=target?`${target.replace(/\/$/,'')}/README.md`:'README.md';
    const chapter=catalog.chapters.find(item=>item.path===target||item.path===index);
    if(chapter)return courseUrl(chapter.id)+url.hash;
    const paths=catalog.filePaths||[];
    const hidden=target.split('/').some(part=>part.startsWith('.'));
    const asset=hidden?null:paths.includes(target)?target:paths.includes(`web/public/${target}`)?`web/public/${target}`:null;
    const encoded=(asset||target).split('/').map(encodeURIComponent).join('/');
    if(asset)return `/learn-claude-code/files/${encoded}${url.hash}`;
    return `${catalog.sourceUrl.replace('/tree/','/blob/')}/${encoded}${url.hash}`;
  }catch{return '';}
}
