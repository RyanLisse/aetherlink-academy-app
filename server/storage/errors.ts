import {Data} from 'effect';

export class FileNotFound extends Data.TaggedError('FileNotFound')<{fileId:string}>{
 get message(){return 'Bestand niet gevonden.';}
}
export class InvalidInput extends Data.TaggedError('InvalidInput')<{reason:string}>{
 get message(){return this.reason;}
}
export class FileTooLarge extends Data.TaggedError('FileTooLarge')<{sizeBytes:number;maxBytes:number}>{
 get message(){return `Bestand is ${(Math.ceil(this.sizeBytes/104857.6)/10).toFixed(1)} MiB; maximaal ${Math.round(this.maxBytes/1048576)} MiB.`;}
}
export class StorageUnavailable extends Data.TaggedError('StorageUnavailable')<{reason?:string;cause?:unknown}>{
 get message(){return this.reason??'Bestandsopslag is tijdelijk niet beschikbaar.';}
}
export class ObjectStoreFailure extends Data.TaggedError('ObjectStoreFailure')<{operation:string;cause:unknown}>{
 get message(){return 'De objectopslag is niet bereikbaar. Probeer het later opnieuw.';}
}
export class Forbidden extends Data.TaggedError('Forbidden')<{reason:string}>{
 get message(){return this.reason;}
}
export type StorageError=FileNotFound|InvalidInput|FileTooLarge|StorageUnavailable|ObjectStoreFailure|Forbidden;

export const httpStatus=(error:StorageError):number=>{
 switch(error._tag){
  case 'FileNotFound':return 404;
  case 'InvalidInput':return 400;
  case 'Forbidden':return 403;
  case 'FileTooLarge':return 413;
  case 'ObjectStoreFailure':return 502;
  case 'StorageUnavailable':return 503;
 }
};
