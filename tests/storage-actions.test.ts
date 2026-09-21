import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createFileStorage} from '../server/storage/runtime.ts';
import {MemoryObjectStore} from '../server/storage/object-store.ts';
import {MAX_UPLOAD_BYTES} from '../server/storage/actions.ts';

const room='11111111-1111-4111-8111-111111111111';
const other='33333333-3333-4333-8333-333333333333';
const ryan={roomId:room,id:'p1',name:'Ryan',role:'participant',source:'human'} as const;
const facilitator={roomId:room,id:'facilitator',name:'Facilitator',role:'facilitator',source:'human'} as const;
const stranger={roomId:other,id:'p9',name:'X',role:'participant',source:'ai'} as const;
const service=()=>createFileStorage({objectStore:MemoryObjectStore});
const rejects=async(promise:Promise<unknown>,status:number,pattern?:RegExp)=>{try{await promise;}catch(error:any){assert.equal(error.status,status,error.message);if(pattern)assert.match(error.message,pattern);return error;}assert.fail('expected rejection');};

test('upload stores bytes with a sha-256 checksum and a room-scoped object key',async()=>{
 const svc=service();
 try{
  const bytes=Buffer.from('# Notulen\n');
  const file=await svc.run('uploadFile',ryan,{filename:'  notulen.md  ',contentType:'text/markdown',bytes}) as any;
  assert.equal(file.filename,'notulen.md');
  assert.equal(file.sizeBytes,bytes.byteLength);
  assert.equal(file.checksum,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(file.uploadedBy.id,'p1');
  assert.equal(file.objectKey,undefined,'the object key stays server-side');
  const listed=await svc.run('listFiles',ryan) as any;
  assert.deepEqual(listed.files.map((f:any)=>f.id),[file.id]);
  const read=await svc.run('getFile',ryan,{fileId:file.id}) as any;
  assert.equal(Buffer.from(read.bytes).toString(),'# Notulen\n');
  assert.equal(read.contentType,'text/markdown');
 }finally{await svc.close();}
});

test('the extension comes from the content type, never from the filename',async()=>{
 const svc=service();
 try{
  const file=await svc.run('uploadFile',ryan,{filename:'evil.svg.html',contentType:'image/png',bytes:Buffer.from('x')}) as any;
  const read=await svc.run('getFile',ryan,{fileId:file.id}) as any;
  assert.equal(read.contentType,'image/png');
  assert.equal(read.filename,'evil.svg.html');
 }finally{await svc.close();}
});

test('the 25 MiB cap and the content-type allowlist reject before anything is stored',async()=>{
 const svc=service();
 try{
  await rejects(svc.run('uploadFile',ryan,{filename:'groot.bin',contentType:'application/pdf',bytes:Buffer.alloc(MAX_UPLOAD_BYTES+1)}),413,/25 MiB/);
  await rejects(svc.run('uploadFile',ryan,{filename:'leeg.txt',contentType:'text/plain',bytes:Buffer.alloc(0)}),400,/leeg/);
  await rejects(svc.run('uploadFile',ryan,{filename:'x.exe',contentType:'application/x-msdownload',bytes:Buffer.from('x')}),400,/niet ondersteund.*text\/markdown/);
  await rejects(svc.run('uploadFile',ryan,{filename:'x'.repeat(201),contentType:'text/plain',bytes:Buffer.from('x')}),400,/filename/);
  await rejects(svc.run('uploadFile',ryan,{filename:'x.txt',contentType:'text/plain'}),400,/bestandsinhoud/);
  assert.deepEqual(await svc.run('listFiles',ryan),{files:[]});
 }finally{await svc.close();}
});

test('files are invisible outside their room; delete needs facilitator or uploader',async()=>{
 const svc=service();
 try{
  const file=await svc.run('uploadFile',ryan,{filename:'prive.txt',contentType:'text/plain',bytes:Buffer.from('geheim')}) as any;
  assert.deepEqual(await svc.run('listFiles',stranger),{files:[]});
  await rejects(svc.run('getFile',stranger,{fileId:file.id}),404);
  await rejects(svc.run('deleteFile',stranger,{fileId:file.id}),404);
  await rejects(svc.run('deleteFile',{...ryan,id:'p2'},{fileId:file.id}),403,/facilitator of de uploader/);
  assert.deepEqual(await svc.run('deleteFile',facilitator,{fileId:file.id}),{deleted:true,fileId:file.id});
  await rejects(svc.run('getFile',ryan,{fileId:file.id}),404);
  const own=await svc.run('uploadFile',ryan,{filename:'eigen.txt',contentType:'text/plain',bytes:Buffer.from('x')}) as any;
  await svc.run('deleteFile',ryan,{fileId:own.id});
  assert.deepEqual(await svc.run('listFiles',ryan),{files:[]});
 }finally{await svc.close();}
});

test('without S3 credentials every action answers 503',async()=>{
 const svc=createFileStorage({config:{bucket:'',endpoint:'',accessKeyId:'',secretAccessKey:'',region:'auto'}});
 try{
  assert.equal(svc.configured,false);
  await rejects(svc.run('listFiles',ryan),503,/niet geconfigureerd/);
  await rejects(svc.run('uploadFile',ryan,{filename:'x.txt',contentType:'text/plain',bytes:Buffer.from('x')}),503);
 }finally{await svc.close();}
});
