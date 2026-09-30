import {useState} from 'react';

/** Busy/error state around async UI actions; `action(fn)` resolves to fn's result, or null after recording the error. */
export function useAsyncAction({initialError='',formatError=message=>message}={}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(initialError);
  async function action(fn){setBusy(true);setError('');try{return await fn();}catch(e){setError(formatError(e.message));return null;}finally{setBusy(false);}}
  return {busy,setBusy,error,setError,action};
}
