import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Phone, Globe, BookOpen, Shield, TrendingUp, Users } from 'lucide-react';
import './StudentCard.css';

export default function StudentCard({ student, anneeScolaire = '2024 - 2025' }) {
  const nom = student?.nom?.toUpperCase() || 'DIALLO';
  const prenoms = student?.prenom || 'Mamadou Saïdou';
  const dateNaissance = student?.date_naissance ? new Date(student.date_naissance).toLocaleDateString('fr-FR') : '12 / 05 / 2010';
  const classe = student?.inscriptions?.[0]?.classe?.nom || '5ème A';
  const matricule = student?.matricule || 'GSP-2024-0521';
  const photoUrl = student?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';
  const qrData = `Nom: ${nom}\nPrénoms: ${prenoms}\nNé(e) le: ${dateNaissance}\nClasse: ${classe}\nMatricule: ${matricule}`;

  return (
    <div className="id-card-wrapper edu-print-root">

      {/* ══════════════ FRONT ══════════════ */}
      <div className="id-card id-card-front" style={{ background: 'white' }}>
        {/* SVG Background shapes */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path d="M300,0 C400,150 400,300 300,450" fill="none" stroke="#C59B27" strokeWidth="40" strokeLinecap="round" />
            <path d="M0,0 L320,0 C240,200 240,450 380,600 L0,600 Z" fill="#0A2F6B" />
          </svg>
        </div>

        {/* Top-right gold badge */}
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#C59B27', padding: '1rem 1.5rem', borderBottomLeftRadius: '16px', zIndex: 2 }}>
          <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Content */}
        <div className="id-card-content" style={{ zIndex: 3, display: 'flex', height: 'calc(100% - 40px)' }}>

          {/* Left col */}
          <div style={{ width: '320px', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <div style={{ width: '190px', height: '190px', borderRadius: '50%', background: 'white', border: '6px solid #C59B27', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <img src="/images/logo_boubacar.png" alt="GSP Logo" style={{ width: '110px', height: 'auto' }} />
                <div style={{ position: 'absolute', bottom: '-16px', background: '#0A2F6B', color: 'white', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, border: '2px solid #C59B27', whiteSpace: 'nowrap' }}>
                  SAVOIR • DISCIPLINE • RÉUSSITE
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.5 }}>
              APPRENDRE AUJOURD'HUI,<br/>
              <span style={{ color: '#C59B27', fontSize: '1.25rem' }}>RÉUSSIR DEMAIN.</span>
            </div>
          </div>

          {/* Right col */}
          <div style={{ flex: 1, padding: '2.5rem 2.5rem 1.5rem 3.5rem', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ color: '#0A2F6B', fontSize: '2.8rem', fontWeight: 900, margin: '0 0 0.4rem 0', letterSpacing: '0.05em' }}>CARTE SCOLAIRE</h1>
            <div style={{ color: '#0A2F6B', fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem' }}>ANNÉE SCOLAIRE {anneeScolaire}</div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
              <div style={{ width: '160px', height: '200px', border: '4px solid #C59B27', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <img src={photoUrl} alt="Photo élève" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingTop: '0.5rem' }}>
                {[
                  { label: 'NOM :', value: nom, bold: true },
                  { label: 'PRÉNOMS :', value: prenoms },
                  { label: 'DATE DE NAISSANCE :', value: dateNaissance },
                  { label: 'CLASSE :', value: classe },
                  { label: 'N° D\'ÉLÈVE :', value: matricule },
                ].map(({ label, value, bold }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#0A2F6B', fontWeight: 800, fontSize: '1.05rem', width: '220px', flexShrink: 0 }}>{label}</span>
                    <span style={{ color: '#0f172a', fontWeight: bold ? 900 : 700, fontSize: '1.05rem' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ alignSelf: 'center', border: '3px solid #e2e8f0', padding: '0.5rem', borderRadius: '12px', background: 'white' }}>
                <QRCodeSVG value={qrData} size={90} level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="id-card-footer">
          <div className="footer-item"><MapPin size={14} color="#C59B27" /><span>Quartier Kouléwondy, Commune de Matam</span></div>
          <div className="footer-divider">|</div>
          <div className="footer-item"><Phone size={14} color="#C59B27" /><span>+224 620 00 00 00</span></div>
          <div className="footer-divider">|</div>
          <div className="footer-item"><Globe size={14} color="#C59B27" /><span>www.gsp-emsd.com</span></div>
        </div>
      </div>

      <div className="page-break-print"></div>

      {/* ══════════════ BACK ══════════════ */}
      <div className="id-card id-card-back" style={{ background: 'white', display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* Diagonal line pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.025 }}>
          <defs>
            <pattern id="diag-back" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#0A2F6B" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-back)" />
        </svg>

        {/* Watermark */}
        <div style={{ position: 'absolute', right: '6%', top: '50%', transform: 'translateY(-50%)', opacity: 0.045, pointerEvents: 'none', zIndex: 0 }}>
          <img src="/images/logo_boubacar.png" alt="" style={{ width: '300px' }} />
        </div>

        {/* ── LEFT COLUMN (Blue) ── */}
        <div style={{ width: '310px', position: 'relative', zIndex: 1, color: 'white', display: 'flex', flexDirection: 'column' }}>
          {/* Blue curved background */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '380px', height: '100%', zIndex: -1 }}>
            <svg width="100%" height="100%" viewBox="0 0 380 600" preserveAspectRatio="none">
              <path d="M0,0 L340,0 C280,180 270,380 370,600 L0,600 Z" fill="#0A2F6B" />
              <path d="M340,0 C280,180 270,380 370,600 L385,600 C285,380 295,180 355,0 Z" fill="#C59B27" opacity="0.85" />
            </svg>
          </div>

          <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>

            {/* Logo + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.7rem' }}>
              <div style={{ background: 'white', padding: '6px', borderRadius: '50%', border: '4px solid #C59B27', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                <img src="/images/logo_boubacar.png" alt="GSP" style={{ width: '82px', height: '82px', objectFit: 'contain', borderRadius: '50%' }} />
              </div>
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.15rem 0', color: 'white', fontWeight: 900, letterSpacing: '0.1em' }}>GSP</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#bfdbfe', lineHeight: 1.4 }}>Elhadj Mamadou<br/>Saïdou Diallo</p>
              <div style={{ width: '50px', height: '3px', background: '#C59B27', borderRadius: '2px' }}></div>
            </div>

            {/* Values grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { Icon: BookOpen, label: 'SAVOIR', desc: 'Acquérir des connaissances.' },
                { Icon: Shield, label: 'DISCIPLINE', desc: 'La rigueur au quotidien.' },
                { Icon: TrendingUp, label: 'RÉUSSITE', desc: 'Se dépasser toujours.' },
                { Icon: Users, label: 'VALEURS', desc: 'Intégrité & citoyenneté.' },
              ].map(({ Icon, label, desc }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.65rem 0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <Icon size={19} color="#C59B27" style={{ marginBottom: '0.35rem' }} />
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.67rem', fontWeight: 900, letterSpacing: '0.04em', color: 'white' }}>{label}</h4>
                  <p style={{ margin: 0, fontSize: '0.6rem', color: '#bfdbfe', lineHeight: 1.3 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid rgba(197,155,39,0.5)', paddingTop: '0.9rem' }}>
              <h4 style={{ color: '#C59B27', fontSize: '0.7rem', marginBottom: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>NOUS CONTACTER</h4>
              {[
                { Icon: MapPin, text: 'Kouléwondy, Commune de Matam' },
                { Icon: Phone, text: '+224 620 00 00 00' },
                { Icon: Globe, text: 'www.gsp-emsd.com' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', fontSize: '0.7rem', color: '#e2e8f0' }}>
                  <Icon size={12} color="#C59B27" style={{ flexShrink: 0 }} /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ flex: 1, padding: '1.75rem 2.25rem 3rem 2.25rem', display: 'flex', flexDirection: 'column', zIndex: 1 }}>

          {/* RÈGLEMENT header with decorative lines */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, #C59B27, transparent)' }}></div>
            <div style={{ background: 'linear-gradient(135deg, #0A2F6B, #1e3a8a)', color: 'white', padding: '0.55rem 1.5rem', borderRadius: '100px', fontWeight: 900, fontSize: '0.92rem', letterSpacing: '0.07em', boxShadow: '0 4px 18px rgba(10,47,107,0.25)', whiteSpace: 'nowrap' }}>
              RÈGLEMENT INTÉRIEUR
            </div>
            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, #C59B27, transparent)' }}></div>
          </div>

          {/* Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {[
              { text: 'Cette carte est strictement <b>personnelle</b> et <b>incessible</b>.', alt: true },
              { text: "Elle doit être <b>obligatoirement présentée</b> à toute réquisition au sein de l'établissement.", alt: false },
              { text: "En cas de perte, prévenir <b>immédiatement l'administration</b> pour son renouvellement.", alt: true },
              { text: "Cette carte doit être conservée en <b>bon état</b> et reste valable pour l'année scolaire en cours uniquement.", alt: false },
            ].map(({ text, alt }, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '0.55rem 0.8rem', borderRadius: '10px', background: alt ? 'rgba(10,47,107,0.05)' : 'transparent', border: `1px solid ${alt ? 'rgba(10,47,107,0.09)' : 'transparent'}` }}>
                <div style={{ width: '25px', height: '25px', minWidth: '25px', borderRadius: '50%', background: 'linear-gradient(135deg, #0A2F6B, #1e3a8a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>{i + 1}</div>
                <span style={{ color: '#1e293b', fontSize: '0.92rem', lineHeight: 1.55, fontWeight: 400 }} dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            ))}
          </div>

          {/* Signature + Stamp */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* Date & Signature */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Date de délivrance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0A2F6B', marginBottom: '1.25rem' }}>{new Date().toLocaleDateString('fr-FR')}</div>
              <div style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '2rem', color: '#0A2F6B', transform: 'rotate(-3deg)', display: 'inline-block', lineHeight: 1 }}>
                B. Diallo
              </div>
            </div>

            {/* Stamp */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Le Chef d'Établissement</div>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                <div style={{ position: 'absolute', inset: 0, border: '3px dashed rgba(10,47,107,0.45)', borderRadius: '50%', transform: 'rotate(-20deg)' }}></div>
                <div style={{ position: 'absolute', inset: '7px', border: '1.5px solid rgba(10,47,107,0.25)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/logo_boubacar.png" alt="" style={{ width: '38px', opacity: 0.45 }} />
                  <div style={{ fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.06em', color: 'rgba(10,47,107,0.55)', marginTop: '2px' }}>GSP • EMSD</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold gradient banner */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '34px', background: 'linear-gradient(to right, #b8860b, #e8b930, #C59B27, #e8b930, #b8860b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2F6B', fontWeight: 900, letterSpacing: '0.18em', fontSize: '0.88rem', zIndex: 2 }}>
          SAVOIR &nbsp;•&nbsp; DISCIPLINE &nbsp;•&nbsp; RÉUSSITE
        </div>
      </div>

    </div>
  );
}
