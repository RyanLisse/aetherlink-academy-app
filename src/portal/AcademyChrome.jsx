import {useI18n} from '../i18n';
import '../../packages/branding/src/tokens.css';

/** Scoped chrome bar for native-app embeds (AET-51). Does not style canvas/video. */
export function AcademyChrome({returnTo, theme = 'dark'}) {
  const {t, locale} = useI18n();
  const href = returnTo || '/';
  return (
    <header className="academy-chrome" data-theme={theme} data-locale={locale}>
      <div className="academy-chrome__bar">
        <div className="academy-chrome__brand">
          AetherLink<span>Academy</span>
        </div>
        <a className="academy-chrome__back" href={href}>{t('apps.backToAcademy')}</a>
      </div>
    </header>
  );
}
