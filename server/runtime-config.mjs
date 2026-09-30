import {readCoachConfig} from './coach.mjs';

export function validateRuntimeEnvironment(env) {
 const google=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ACADEMY_FACILITATOR_DOMAINS'],configured=google.filter(key=>String(env[key]||'').trim());
 if(configured.length&&configured.length!==google.length)throw Error('Google sign-in requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ACADEMY_FACILITATOR_DOMAINS to all be set.');
 readCoachConfig(env);
 if ((env.ACADEMY_STORAGE || 'postgres') !== 'postgres') throw Error('Academy requires ACADEMY_STORAGE=postgres. LocalStore remains available only for isolated tests.');
 if (!env.DATABASE_URL) throw Error('DATABASE_URL is required. Load the 1Password environment before starting Academy.');
 if (!env.VERCEL) return;
 const redis = env.REDIS_URL || env.KV_URL;
 let redisProtocol;
 try { redisProtocol = new URL(redis).protocol; } catch {}
 if (redisProtocol !== 'rediss:') throw Error('Vercel requires a shared TLS Redis connection in REDIS_URL or KV_URL.');
 if (!env.ACADEMY_HOST_KEY || env.ACADEMY_HOST_KEY.length < 32) throw Error('ACADEMY_HOST_KEY must contain at least 32 characters and be shared by all Vercel instances.');
 const signingSecret = env.ACADEMY_SIGNING_SECRET || env.PROOF_COLLAB_SIGNING_SECRET;
 if (!signingSecret || signingSecret.length < 32) throw Error('ACADEMY_SIGNING_SECRET must contain at least 32 characters and be shared by all Vercel instances.');
 let origin;
 try { origin = new URL(env.ACADEMY_PUBLIC_URL); } catch { throw Error('ACADEMY_PUBLIC_URL must be the deployed HTTPS origin.'); }
 if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw Error('ACADEMY_PUBLIC_URL must be the deployed HTTPS origin without credentials, path, query or fragment.');
}
