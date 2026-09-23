import {useEffect, useState} from 'react';
import {LayoutGrid, ArrowRight, ExternalLink} from 'lucide-react';
import {api} from '../api';
import {useI18n} from '../i18n';

export function AppsLauncher({action, busy, hostKey, facilitator}) {
  const {t} = useI18n();
  const [apps, setApps] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [lastLaunch, setLastLaunch] = useState(null);
  const [published, setPublished] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api('apps');
        if (!active) return;
        setApps(data.apps || []);
        setInventory(data.inventory || null);
      } catch {
        if (active) setApps([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const authBody = facilitator ? {} : (hostKey ? {hostKey} : {});

  return (
    <section className="content-panel academy-chrome" data-theme="dark" aria-labelledby="apps-launcher-title">
      <p className="cyan"><LayoutGrid size={16}/> {t('apps.eyebrow')}</p>
      <h2 id="apps-launcher-title">{t('apps.title')}</h2>
      <p className="lede">{t('apps.lede')}</p>
      {inventory && (
        <p className="notice" role="note">
          <strong>{t('apps.authInventory')}</strong>
          <span> Better Auth: {inventory.betterAuth ? 'yes' : 'no'} · {t('apps.googleDep')}</span>
        </p>
      )}
      <ul className="apps-launcher-list">
        {apps.map((app) => (
          <li key={app.id} className="evidence">
            <h3>{app.id}</h3>
            <p className="muted">{app.status}{app.blockedBy ? ` · blocked ${app.blockedBy}` : ''}</p>
            <div className="form-row" style={{gap: 8, flexWrap: 'wrap'}}>
              <button
                type="button"
                className="gradient"
                disabled={busy || !app.launchable}
                onClick={() => action(async () => {
                  const result = await api(`apps/${app.id}/launch`, {
                    ...authBody,
                    returnTo: `${window.location.origin}/?view=apps`,
                  });
                  setLastLaunch(result);
                })}
              >
                {t('apps.launch')} <ExternalLink size={16}/>
              </button>
              <button
                type="button"
                disabled={busy || !facilitator && !hostKey}
                onClick={() => action(async () => {
                  const result = await api(`apps/${app.id}/publish`, {
                    ...authBody,
                    contentRef: {kind: 'day-pack', day: 1},
                  });
                  setPublished(result);
                })}
              >
                {t('apps.publish')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {lastLaunch && (
        <div className="notice" aria-live="polite">
          <strong>{t('apps.launchReady')}</strong>
          <p className="muted">{t('apps.backNav')}: <code>{lastLaunch.backToAcademy}</code></p>
          <p><a href={lastLaunch.launch.startUrl}>{lastLaunch.launch.startUrl}</a></p>
          <button
            type="button"
            className="text-button"
            onClick={() => action(async () => {
              await api(`apps/grants/${lastLaunch.grantId}/revoke`, authBody);
              setLastLaunch(null);
            })}
          >
            {t('apps.revoke')}
          </button>
        </div>
      )}
      {published && (
        <div className="notice">
          <strong>{t('apps.published')}</strong>
          <p><code>{published.contentSha256}</code></p>
        </div>
      )}
      <p className="muted"><ArrowRight size={14}/> {t('apps.chromeHint')}</p>
    </section>
  );
}
