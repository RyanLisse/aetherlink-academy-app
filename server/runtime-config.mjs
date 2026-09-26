import {readCoachConfig} from './coach.mjs';

export function validateRuntimeEnvironment(env) {
 const google=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ACADEMY_FACILITATOR_DOMAINS'],configured=google.filter(key=>String(env[key]||'').trim());
 if(configured.length&&configured.length!==google.length)throw Error('Google-login vereist dat GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en ACADEMY_FACILITATOR_DOMAINS alle drie zijn ingesteld.');
 readCoachConfig(env);
 if ((env.ACADEMY_STORAGE || 'postgres') !== 'postgres') throw Error('The integrated Proof runtime requires ACADEMY_STORAGE=postgres. LocalStore remains available only for isolated tests.');
 if (!env.DATABASE_URL) throw Error('DATABASE_URL is required. Load the 1Password environment before starting Academy.');
 if (!env.VERCEL) return;
 const redis = env.REDIS_URL || env.KV_URL;
 let redisProtocol;
 try { redisProtocol = new URL(redis).protocol; } catch {}
 if (redisProtocol !== 'rediss:') throw Error('Vercel requires a shared TLS Redis connection in REDIS_URL or KV_URL.');
 for (const key of ['ACADEMY_HOST_KEY', 'PROOF_COLLAB_SIGNING_SECRET']) {
  if (!env[key] || env[key].length < 32) throw Error(`${key} must contain at least 32 characters and be shared by all Vercel instances.`);
 }
 let origin;
 try { origin = new URL(env.ACADEMY_PUBLIC_URL); } catch { throw Error('ACADEMY_PUBLIC_URL must be the deployed HTTPS origin.'); }
 if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw Error('ACADEMY_PUBLIC_URL must be the deployed HTTPS origin without credentials, path, query or fragment.');
}
