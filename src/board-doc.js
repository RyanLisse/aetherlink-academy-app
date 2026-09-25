import * as Y from 'yjs';
import {HocuspocusProvider,HocuspocusProviderWebsocket} from '@hocuspocus/provider';

const PROOF_HEADERS={'x-proof-client-version':'0.30.0','x-proof-client-build':'academy-board','x-proof-client-protocol':'3'};
const LISTS=new Set(['bullet_list','ordered_list']);
const textOf=node=>node instanceof Y.XmlText?node.toDelta().map(part=>typeof part.insert==='string'?part.insert:'').join(''):node.toArray().map(textOf).join('');
const isColumn=node=>node instanceof Y.XmlElement&&node.nodeName==='heading'&&Number(node.getAttribute('level')??2)===2;

export function readColumns(fragment){
  const columns=[];
  for(const node of fragment.toArray()){
    if(isColumn(node)){columns.push({title:textOf(node).trim(),cards:[]});continue;}
    const column=columns.at(-1);if(!column||!(node instanceof Y.XmlElement))continue;
    const texts=LISTS.has(node.nodeName)?node.toArray().map(textOf):[textOf(node)];
    for(const text of texts)if(text.trim())column.cards.push(text.trim());
  }
  return columns;
}

export function addCard(doc,fragment,columnIndex,text){
  const nodes=fragment.toArray(),headings=nodes.flatMap((node,index)=>isColumn(node)?[index]:[]);
  const at=headings[columnIndex];if(at===undefined)throw Error(`Kolom ${columnIndex} bestaat niet.`);
  const next=nodes[at+1],paragraph=new Y.XmlElement('paragraph'),item=new Y.XmlElement('list_item');
  paragraph.insert(0,[new Y.XmlText(text)]);item.insert(0,[paragraph]);
  doc.transact(()=>{if(next instanceof Y.XmlElement&&LISTS.has(next.nodeName))next.insert(next.length,[item]);else{const list=new Y.XmlElement('bullet_list');list.insert(0,[item]);fragment.insert(at+1,[list]);}},'human:academy-board');
}

// Proof authenticates the socket from its URL token, so every close refreshes the session before the provider reconnects; the role (editor or viewer) then follows the board status.
export async function connectBoard(slug,{onColumns,onStatus}){
  const session=async()=>{const res=await fetch(`/api/documents/${slug}/collab-session`,{headers:PROOF_HEADERS,credentials:'same-origin'});const data=await res.json();if(!res.ok||!data.session)throw Error(data.error||'Proof-sessie mislukt.');return {slug,role:data.session.role,token:data.session.token};};
  let parameters=await session();
  const doc=new Y.Doc(),fragment=doc.getXmlFragment('prosemirror');
  const socket=new HocuspocusProviderWebsocket({url:`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`,parameters});
  const refresh=()=>session().then(next=>{parameters=next;socket.configuration.parameters=next;}).catch(()=>onStatus('denied'));
  const provider=new HocuspocusProvider({websocketProvider:socket,name:slug,document:doc,token:()=>parameters.token,onSynced:()=>onStatus('synced'),onClose:()=>{onStatus('offline');refresh();},onAuthenticationFailed:()=>onStatus('denied')});
  const emit=()=>onColumns(readColumns(fragment));fragment.observeDeep(emit);emit();
  return {add:(columnIndex,text)=>addCard(doc,fragment,columnIndex,text),close(){fragment.unobserveDeep(emit);provider.destroy();socket.destroy();doc.destroy();}};
}
