import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Heart, Rocket, Play, BookOpen, BarChart2, User, Microscope, PenTool, MessageCircle, ClipboardList, Trophy, Phone, Mail, MapPin, Send, Share2, Camera, Briefcase, MonitorPlay, Star } from 'lucide-react';
import './Home.css';

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Accueil', href: '#accueil' },
    { label: 'À Propos', href: '#apropos' },
    { label: 'Galerie', href: '#galerie' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <a href="#accueil" className="navbar__logo">
          <div className="navbar__logo-icon">
            <img src="/images/logo_boubacar.png" alt="Logo École" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-main" style={{ fontSize: '0.9rem' }}>GSP Elhadj Mamadou Saïdou Diallo</span>
            <span className="navbar__logo-sub">Du primaire au lycée</span>
          </div>
        </a>

        {/* Nav links */}
        <ul className={`navbar__links${menuOpen ? ' open' : ''}`}>
          {navLinks.map(link => (
            <li key={link.label}>
              <a href={link.href} className="navbar__link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA buttons */}
        <div className="navbar__actions">
          <Link to="/infos" className="btn btn--ghost" id="nav-infos" style={{ marginRight: '0.5rem' }}>Infos &amp; Tarifs</Link>
          <Link to="/login" className="btn btn--ghost" id="nav-connexion">Connexion</Link>
        </div>

        {/* Mobile burger */}
        <button className="navbar__burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`burger-bar${menuOpen ? ' open' : ''}`}></span>
          <span className={`burger-bar${menuOpen ? ' open' : ''}`}></span>
          <span className={`burger-bar${menuOpen ? ' open' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────── */
function Hero() {
  const slides = [
    {
      url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop',
      caption: 'Excellence et Rigueur',
    },
    {
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2032&auto=format&fit=crop',
      caption: 'Un cadre d\'apprentissage moderne',
    },
    {
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop',
      caption: 'Du primaire au lycée',
    },
    {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
      caption: 'L\'épanouissement de chaque élève',
    },
  ];

  const badges = ['Primaire', 'Collège', 'Lycée', 'Excellence'];
  const badgeIcons = [<User size={16} />, <BookOpen size={16} />, <ClipboardList size={16} />, <BarChart2 size={16} />];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero hero--full" id="accueil">
      {/* Slides */}
      <div className="hero__slides">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`hero__slide${i === current ? ' hero__slide--active' : ''}`}
            style={{ backgroundImage: `url('${s.url}')` }}
          />
        ))}
      </div>

      {/* Overlay gradient */}
      <div className="hero__overlay" />

      {/* Content */}
      <div className="hero__container-full">
        <div className="hero__badge-top">
          <span className="dot dot--green" />
          Établissement d'Excellence
        </div>
        <h1 className="hero__title">
          GSP Elhadj Mamadou<br />
          <span className="hero__title-highlight">Saïdou Diallo</span>
        </h1>
        <p className="hero__desc">
          Un cadre d'apprentissage stimulant pour accompagner vos enfants vers la réussite.
          De la maternelle au lycée, nous formons les leaders de demain avec rigueur et bienveillance.
        </p>
        <div className="hero__cta hero__cta--center">
          <Link to="/infos" className="btn btn--primary btn--lg">
            Nous rejoindre →
          </Link>
          <a href="#apropos" className="btn btn--outline btn--lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
             Découvrir l'école
          </a>
        </div>
        <div className="hero__badges hero__badges--center">
          {badges.map((b, i) => (
            <div className="hero__tag" key={b}>
              <span className="hero__tag-icon" style={{ color: 'var(--primary)' }}>{badgeIcons[i]}</span>
              {b}
            </div>
          ))}
        </div>

        {/* Indicateurs de slide */}
        <div className="hero__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero__dot${i === current ? ' hero__dot--active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS BAR ───────────────────────────────────────────── */
function StatsBar() {
  const [dataStats, setDataStats] = useState({ eleves: '...', professeurs: '...', classes: '...' });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/admin/stats`)
      .then(res => res.json())
      .then(data => {
        setDataStats({
          eleves: data.eleves || '0',
          professeurs: data.professeurs || '0',
          classes: data.classes || '0'
        });
      })
      .catch(err => console.error('Erreur chargement stats:', err));
  }, []);

  const stats = [
    { num: `${dataStats.eleves}+`, label: 'Élèves formés', icon: <Users size={28} />, color: '#0A2F6B' },
    { num: `${dataStats.professeurs}`, label: 'Professeurs qualifiés', icon: <GraduationCap size={28} />, color: '#0A2F6B' },
    { num: `${dataStats.classes}`, label: 'Classes équipées', icon: <BookOpen size={28} />, color: '#1a4e9b' },
    { num: '100%', label: 'Taux de réussite', icon: <ClipboardList size={28} />, color: '#2b6dc4' },
    { num: '25+', label: 'Ans d\'expérience', icon: <MessageCircle size={28} />, color: '#f59e0b' },
  ];

  return (
    <section className="stats-bar" id="stats">
      <div className="stats-bar__inner">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card__icon" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-card__num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── ABOUT SECTION ────────────────────────────────── */
function AboutSection() {
  const milestones = [
    { year: '1998', title: 'Fondation', desc: 'Elhadj Mamadou Saïdou Diallo fonde le GSP avec une seule classe primaire et une vision : offrir une éducation d’excellence accessible à tous.' },
    { year: '2005', title: 'Ouverture du Collège', desc: 'Fort de son succès au primaire, l’établissement ouvre son premier cycle secondaire (6ème – 3ème) pour accompagner ses élèves plus loin.' },
    { year: '2012', title: 'Ouverture du Lycée', desc: 'Le GSP franchit une nouvelle étape avec l’ouverture des classes de seconde, première et terminale, devenant un établissement complet de la maternelle au BAC.' },
    { year: '2024', title: 'Numérisation', desc: 'Lancement de la plateforme ERP pour moderniser la gestion de l’établissement, des inscriptions jusqu’aux bulletins numériques.' },
  ];

  const values = [
    { icon: <Trophy size={28} />, color: '#0A2F6B', title: 'Excellence', desc: 'Nous visons les plus hauts standards pédagogiques pour chaque élève.' },
    { icon: <Heart size={28} />, color: '#0A2F6B', title: 'Respect', desc: 'Un environnement bienveillant où chaque individu est valorisé.' },
    { icon: <Rocket size={28} />, color: '#0A2F6B', title: 'Innovation', desc: 'Des méthodes modernes et un suivi personnalisé pour chaque parcours.' },
    { icon: <GraduationCap size={28} />, color: '#1a4e9b', title: 'Engagement', desc: 'Un corps enseignant dévoué, présent du premier jour jusqu’au baccalauréat.' },
  ];

  return (
    <section className="about-section" id="apropos">
      {/* Hero Banner */}
      <div className="about-banner">
        <div className="about-banner__content">
          <div className="section-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>À PROPOS DE NOUS</div>
          <h2 className="about-banner__title">Une histoire d’éducation,<br /><span>depuis plus de 25 ans</span></h2>
          <p className="about-banner__sub">Le Groupe Scolaire Privé Elhadj Mamadou Saïdou Diallo est né d’une conviction profonde : chaque enfant mérite une éducation de qualité, un encadrement bienveillant, et un avenir à la hauteur de ses ambitions. De la maternelle jusqu’au Baccalauréat, nous accompagnons chaque élève dans sa croissance intellectuelle, morale et sociale.</p>
        </div>
        <div className="about-banner__stats">
          <div className="about-stat"><span className="about-stat__num">+25</span><span className="about-stat__label">Ans d’existence</span></div>
          <div className="about-stat"><span className="about-stat__num">3</span><span className="about-stat__label">Cycles scolaires</span></div>
          <div className="about-stat"><span className="about-stat__num">95%</span><span className="about-stat__label">Taux de réussite</span></div>
          <div className="about-stat"><span className="about-stat__num">1000+</span><span className="about-stat__label">Élèves formés</span></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="about-timeline__wrapper">
        <div className="about-timeline__header">
          <div className="section-badge">NOTRE HISTOIRE</div>
          <h3 className="about-timeline__title">Des jalons qui ont façonné notre établissement</h3>
        </div>
        <div className="about-timeline">
          {milestones.map((m, i) => (
            <div className={`about-timeline__item ${i % 2 === 0 ? 'left' : 'right'}`} key={i}>
              <div className="about-timeline__card">
                <div className="about-timeline__year">{m.year}</div>
                <h4 className="about-timeline__event">{m.title}</h4>
                <p className="about-timeline__desc">{m.desc}</p>
              </div>
            </div>
          ))}
          <div className="about-timeline__line"></div>
        </div>
      </div>

      {/* Values */}
      <div className="about-values">
        <div className="about-values__header">
          <div className="section-badge">NOS VALEURS</div>
          <h3 className="section-title">Ce qui nous <span className="highlight">guide</span></h3>
        </div>
        <div className="about-values__grid">
          {values.map((v, i) => (
            <div className="about-value-card" key={i}>
              <div className="about-value-card__icon" style={{ color: v.color, background: `${v.color}15` }}>
                {v.icon}
              </div>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TEAM (PERSONNEL) ────────────────────────────────────── */
function TeamSection() {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/admin/professeurs`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(prof => ({
            name: `${prof.prenom} ${prof.nom}`,
            role: prof.specialite || 'Enseignant',
            desc: `Professeur de ${prof.specialite || 'plusieurs matières'}. Contact: ${prof.contact || 'Non spécifié'}`,
            img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' // Placeholder avatar
          }));
          setTeam(formatted);
        }
      })
      .catch(err => console.error('Erreur chargement professeurs:', err));
  }, []);

  return (
    <section className="team-section" id="equipe">
      <div className="team-section__container">
        <div className="section-badge">CORPS PROFESSORAL</div>
        <h2 className="section-title">
          Un personnel qualifié et <span className="highlight">passionné</span>
        </h2>
        <p className="section-subtitle">
          Découvrez les enseignants qui accompagnent vos enfants au quotidien avec dévouement et expertise.
        </p>
        
        {team.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Aucun enseignant n'est encore enregistré.
          </div>
        ) : (
          <div className="team__grid">
            {team.map((member, i) => (
              <div className="team-card" key={i}>
                <div className="team-card__avatar">
                  <img src={member.img} alt={`Portrait de ${member.name}`} loading="lazy" />
                </div>
                <h3 className="team-card__name">{member.name}</h3>
                <div className="team-card__role">{member.role}</div>
                <p className="team-card__desc">{member.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── GALLERY ─────────────────────────────────────────────── */
function Gallery() {
  const photos = [
    { bg: 'url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop)', label: 'Environnement inclusif et adapté' },
    { bg: 'url(https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop)', label: 'Équipe qualifiée et passionnée' },
    { bg: 'url(https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600&auto=format&fit=crop)', label: 'Programme personnalisé' },
    { bg: 'url(https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop)', label: 'Suivi étroit avec la famille' },
    { bg: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop)', label: 'Spécialisé et certifié' },
  ];

  return (
    <section className="gallery" id="admissions">
      <div className="gallery__container">
        <h2 className="section-title">
          Une école adaptée, <span className="highlight">un avenir meilleur</span>
        </h2>
        <div className="gallery__grid">
          {photos.map((p, i) => (
            <div className="gallery__card" key={i} id={`gallery-${i}`}>
              <div className="gallery__img" style={{ backgroundImage: p.bg, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }}>
              </div>
              <div className="gallery__overlay">
                <p className="gallery__label">{p.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ────────────────────────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      quote: "Mes enfants ont fait d'énormes progrès depuis qu'ils font partie de ces programmes. Nous sommes extrêmement reconnaissants.",
      author: 'Yamila Touré',
      role: 'Parent d\'élève',
      avatar: <User size={24} color="#64748b" />,
      stars: 5,
    },
    {
      quote: "L'équipe est formidable, professionnelle et toujours à l'écoute. Je recommande vivement cette école à toutes les familles.",
      author: 'Kamilia Diop',
      role: 'Parent d\'élève',
      avatar: <User size={24} color="#64748b" />,
      stars: 5,
    },
    {
      quote: "Le suivi personnalisé de mon fils a transformé son quotidien scolaire. Un programme exceptionnel !",
      author: 'Marc Fontaine',
      role: 'Parent d\'élève',
      avatar: <User size={24} color="#64748b" />,
      stars: 5,
    },
  ];

  return (
    <section className="testimonials" id="actualites">
      <div className="testimonials__container">
        <div className="section-badge">TÉMOIGNAGES</div>
        <h2 className="section-title">Ils nous font confiance</h2>
        <div className="testimonials__grid">
          {testimonials.map((t, i) => (
            <div className="testi-card" key={i} id={`testi-${i}`}>
              <div className="testi-stars" style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
                {[...Array(t.stars)].map((_, idx) => (
                  <Star key={idx} size={16} fill="#fbbf24" color="#fbbf24" />
                ))}
              </div>
              <p className="testi-quote">"{t.quote}"</p>
              <div className="testi-author">
                <div className="testi-avatar" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.avatar}</div>
                <div>
                  <div className="testi-name">{t.author}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CONTACT CTA ─────────────────────────────────────────── */
function ContactCTA() {
  return (
    <section className="contact-cta" id="contact">
      <div className="contact-cta__wrapper">
        <div className="contact-cta__decorative contact-cta__decorative--1"></div>
        <div className="contact-cta__decorative contact-cta__decorative--2"></div>
        
        <div className="contact-cta__container">
          <div className="contact-cta__left">
            <div className="contact-cta__left-content">
              <div className="contact-icon-wrapper">
                <MessageCircle size={32} className="contact-icon" />
              </div>
              <h2 className="contact-cta__title">Vous avez des <span className="highlight-white">questions ?</span></h2>
              <p className="contact-cta__desc">
                Notre équipe est disponible du lundi au vendredi pour répondre à toutes vos questions 
                sur nos programmes et l'inscription.
              </p>
              <div className="contact-info">
                <div className="contact-info__item">
                  <div className="contact-info__icon"><Phone size={20} /></div>
                  <div className="contact-info__text">
                    <span className="contact-info__label">Appelez-nous</span>
                    <span className="contact-info__value">+33 1 23 45 67 89</span>
                  </div>
                </div>
                <div className="contact-info__item">
                  <div className="contact-info__icon"><Mail size={20} /></div>
                  <div className="contact-info__text">
                    <span className="contact-info__label">Écrivez-nous</span>
                    <span className="contact-info__value">contact@ecole-speciale.fr</span>
                  </div>
                </div>
                <div className="contact-info__item">
                  <div className="contact-info__icon"><MapPin size={20} /></div>
                  <div className="contact-info__text">
                    <span className="contact-info__label">Rendez-nous visite</span>
                    <span className="contact-info__value">12 Rue de l'Éducation, Paris</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="contact-cta__right">
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Merci ! Votre message a bien été envoyé."); }}>
              <div className="contact-form__header">
                <h3 className="contact-form__title">Envoyez-nous un message</h3>
                <p className="contact-form__subtitle">Nous vous répondrons dans les plus brefs délais.</p>
              </div>
              <div className="form-row">
                <div className="form-group form-group--floating">
                  <input type="text" className="form-input" placeholder=" " id="form-name" required />
                  <label htmlFor="form-name" className="form-label">Votre nom</label>
                </div>
                <div className="form-group form-group--floating">
                  <input type="email" className="form-input" placeholder=" " id="form-email" required />
                  <label htmlFor="form-email" className="form-label">Votre email</label>
                </div>
              </div>
              <div className="form-group form-group--floating">
                <textarea className="form-textarea" placeholder=" " rows="4" id="form-message" required></textarea>
                <label htmlFor="form-message" className="form-label">Votre message...</label>
              </div>
              <button type="submit" className="btn-submit-premium" id="form-submit">
                <span>Envoyer le message</span> <Send size={18} className="btn-icon" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src="/images/logo_boubacar.png" alt="Logo École" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' }} />
            GSP Elhadj Mamadou Saïdou Diallo
          </div>
          <p className="footer__tagline">
            Groupe Scolaire Privé Elhadj Mamadou Saïdou Diallo, accompagnant vos enfants du primaire au lycée.
          </p>
          <div className="footer__social" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Facebook"><Share2 size={20} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram"><Camera size={20} /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="LinkedIn"><Briefcase size={20} /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="YouTube"><MonitorPlay size={20} /></a>
          </div>
        </div>

        <div className="footer__links-group">
          <h4>Liens rapides</h4>
          <ul>
            <li><a href="#accueil">Accueil</a></li>
            <li><a href="#apropos">À propos</a></li>
            <li><a href="#galerie">Galerie</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer__links-group" id="services">
          <h4>Nos services</h4>
          <ul>
            <li><a href="#services">Suivi Individualisé</a></li>
            <li><a href="#services">Interventions spécialisées</a></li>
            <li><a href="#services">Évaluations adaptées</a></li>
            <li><a href="#services">Communication</a></li>
          </ul>
        </div>

        <div className="footer__links-group">
          <h4>Informations</h4>
          <ul>
            <li><a href="#admissions">Admissions</a></li>
            <li><a href="/infos">Tarifs</a></li>
            <li><a href="#equipe">Équipe</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer__links-group">
          <h4>Newsletter</h4>
          <p className="footer__nl-desc">Restez informé de nos actualités</p>
          <div className="footer__nl-form">
            <input type="email" placeholder="Votre email" className="footer__nl-input" />
            <button className="btn btn--primary" id="footer-nl-submit">S'abonner</button>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2024 GSP Elhadj Mamadou Saïdou Diallo. Tous droits réservés.</p>
        <div className="footer__bottom-links">
          <a href="#">Mentions légales</a>
          <a href="#">Confidentialité</a>
          <a href="#">CGU</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <StatsBar />
      <AboutSection />

      <TeamSection />
      <Gallery />
      <Testimonials />
      <ContactCTA />
      <Footer />
    </div>
  );
}
