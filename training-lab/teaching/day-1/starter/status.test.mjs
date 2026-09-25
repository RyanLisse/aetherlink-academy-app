import {test} from 'node:test';
import assert from 'node:assert/strict';
import {articles,published} from './status.mjs';
test('Alleen gepubliceerde artikelen zijn zichtbaar',()=>assert.deepEqual(published(articles).map(x=>x.title),['Werkafspraken']));
