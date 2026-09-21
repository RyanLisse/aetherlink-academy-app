import {Schema} from 'effect';

/** The allowlist doubles as the object-key extension map; never trust the filename. */
export const CONTENT_TYPES={
 'image/png':'.png',
 'image/jpeg':'.jpg',
 'image/gif':'.gif',
 'image/webp':'.webp',
 'image/svg+xml':'.svg',
 'application/pdf':'.pdf',
 'text/plain':'.txt',
 'text/markdown':'.md',
 'text/csv':'.csv',
 'application/json':'.json',
} as const;
export type ContentTypeName=keyof typeof CONTENT_TYPES;
export const ContentType=Schema.Literal(...(Object.keys(CONTENT_TYPES) as [ContentTypeName,...ContentTypeName[]]));
export const extensionFor=(contentType:ContentTypeName)=>CONTENT_TYPES[contentType];

const Text=(max:number)=>Schema.String.pipe(Schema.maxLength(max));
export const Uploader=Schema.Struct({id:Text(100),name:Text(100)});

export class StoredFile extends Schema.Class<StoredFile>('StoredFile')({
 id:Schema.UUID,
 roomId:Schema.UUID,
 objectKey:Text(300),
 filename:Text(200),
 contentType:ContentType,
 sizeBytes:Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
 checksum:Text(64),
 uploadedBy:Uploader,
 createdAt:Schema.String,
}){}
export const decodeStoredFile=Schema.decodeUnknown(StoredFile);
export const encodeStoredFile=Schema.encodeSync(StoredFile);

export const UploadInput=Schema.Struct({filename:Text(200).pipe(Schema.minLength(1)),contentType:ContentType});
export const FileIdInput=Schema.Struct({fileId:Schema.UUID});
