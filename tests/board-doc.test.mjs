import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';
import {addCard,readColumns} from '../src/board-doc.js';

function boardFragment(){
 const doc=new Y.Doc(),fragment=doc.getXmlFragment('prosemirror');
 const heading=(level,text)=>{const node=new Y.XmlElement('heading');node.setAttribute('level',level);node.insert(0,[new Y.XmlText(text)]);return node;};
 fragment.insert(0,[heading(1,'Squad Noord'),heading(2,'Werkte goed'),heading(2,'Lastig'),heading(2,'Volgende keer')]);
 return {doc,fragment};
}

test('addCard inserts list items under the chosen column and readColumns reads them back',()=>{
 const {doc,fragment}=boardFragment();
 assert.deepEqual(readColumns(fragment),[{title:'Werkte goed',cards:[]},{title:'Lastig',cards:[]},{title:'Volgende keer',cards:[]}]);
 addCard(doc,fragment,0,'Pairing met de n8n-agent');
 addCard(doc,fragment,0,'Snelle review');
 addCard(doc,fragment,2,'Eerder testen');
 assert.deepEqual(readColumns(fragment),[{title:'Werkte goed',cards:['Pairing met de n8n-agent','Snelle review']},{title:'Lastig',cards:[]},{title:'Volgende keer',cards:['Eerder testen']}]);
 assert.deepEqual(fragment.toArray().map(node=>node.nodeName),['heading','heading','bullet_list','heading','heading','bullet_list']);
 assert.throws(()=>addCard(doc,fragment,3,'x'),/Kolom 3 bestaat niet/);
});
