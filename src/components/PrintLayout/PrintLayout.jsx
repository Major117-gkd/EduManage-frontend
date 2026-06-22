import {
  SCHOOL_NAME,
  SCHOOL_MOTTO,
} from '../../utils/printConstants';

export function PrintDocument({ children, className = '' }) {
  return (
    <div className={`edu-print-doc ${className}`.trim()}>
      {children}
    </div>
  );
}

export function PrintHeader({
  docTitle,
  docSubtitle,
  badge,
  reference,
  showMotto = true,
}) {
  return (
    <header className="edu-print-header">
      <div className="edu-print-header__accent" aria-hidden />
      <div className="edu-print-header__inner">
        <div className="edu-print-header__brand">
          <div className="edu-print-header__logo-wrap">
            <img
              src="/images/logo_boubacar.png"
              alt=""
              className="edu-print-header__logo"
            />
          </div>
          <div className="edu-print-header__school">
            <h1>{SCHOOL_NAME}</h1>
            {showMotto && <p className="edu-print-header__motto">{SCHOOL_MOTTO}</p>}
          </div>
        </div>
        <div className="edu-print-header__doc">
          {badge && <span className="edu-print-doc-badge">{badge}</span>}
          <h2 className="edu-print-header__title">{docTitle}</h2>
          {docSubtitle && <p className="edu-print-header__subtitle">{docSubtitle}</p>}
          {reference && <span className="edu-print-header__ref">{reference}</span>}
        </div>
      </div>
      <div className="edu-print-header__rule" aria-hidden />
    </header>
  );
}

export function PrintMeta({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="edu-print-meta">
      {items.map((item) => (
        <div key={item.label} className="edu-print-meta__item">
          <span className="edu-print-meta__label">{item.label}</span>
          <strong className="edu-print-meta__value">{item.value ?? '—'}</strong>
        </div>
      ))}
    </div>
  );
}

export function PrintStats({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="edu-print-stats">
      {items.map((item) => (
        <div
          key={item.label}
          className={`edu-print-stats__item${item.variant ? ` edu-print-stats__item--${item.variant}` : ''}`}
        >
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function PrintSection({ title, variant, children, className = '' }) {
  return (
    <section className={`edu-print-section${variant ? ` edu-print-section--${variant}` : ''} ${className}`.trim()}>
      {title != null && title !== '' && (
        <h3 className="edu-print-section__title">{title}</h3>
      )}
      {children}
    </section>
  );
}

export function PrintTable({ children, className = '' }) {
  return (
    <div className="edu-print-table-wrap">
      <table className={`edu-print-table ${className}`.trim()}>
        {children}
      </table>
    </div>
  );
}

export function PrintFooter({ children, signatures }) {
  return (
    <footer className="edu-print-footer">
      {children && <div className="edu-print-footer__note">{children}</div>}
      {signatures && signatures.length > 0 && (
        <div className="edu-print-footer__signatures">
          {signatures.map((sig) => (
            <div key={sig} className="edu-print-footer__sign-block">
              <span>{sig}</span>
              <div className="edu-print-footer__sign-line" />
            </div>
          ))}
        </div>
      )}
      <p className="edu-print-footer__legal">
        Document officiel — {SCHOOL_NAME} · EduManage
      </p>
    </footer>
  );
}
