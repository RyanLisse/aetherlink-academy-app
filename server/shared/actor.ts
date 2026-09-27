/** Who is acting; derived from the academy session, never from the payload. */
export interface Actor{readonly roomId:string;readonly id:string;readonly name:string;readonly role:'facilitator'|'participant';readonly source:'human'|'ai';}
