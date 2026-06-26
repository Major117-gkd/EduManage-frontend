import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Clock, ChevronRight,
  GraduationCap, BookOpen, Award, Users,
  CreditCard, CheckCircle, Star, ArrowLeft
} from 'lucide-react';
import './SchoolInfoPage.css';
import Chatbot from './Chatbot';

/* ─── DATA ──────────────────────────────────────────── */
const contacts = [
  { icon: <Phone size={22} />, label: 'Téléphone principal', value: '+224 629 40 30 19' },
  { icon: <Mail size={22} />, label: 'Email', value: 'samakedelamou858@gmail.com' },
  { icon: <MapPin size={22} />, label: 'Adresse', value: 'Labé, Guinée' },
  { icon: <Clock size={22} />, label: 'Heures d\'ouverture', value: 'Lun–Ven : 7h30 – 17h00' },
];

const niveaux = [
  {
    icon: <BookOpen size={28} />,
    niveau: 'Primaire',
    classes: 'CP • CE1 • CE2 • CM1 • CM2',
    description: 'Une base solide pour les apprentissages fondamentaux.',
    color: '#0A2F6B',
  },
  {
    icon: <GraduationCap size={28} />,
    niveau: 'Collège',
    classes: '6ème • 5ème • 4ème • 3ème',
    description: 'Développement intellectuel et préparation au lycée.',
    color: '#1a4e9b',
  },
  {
    icon: <Award size={28} />,
    niveau: 'Lycée',
    classes: '2nde • 1ère • Terminale',
    description: 'Préparation au Baccalauréat et aux grandes écoles.',
    color: '#2b6dc4',
  },
];

const tarifs = [
  {
    niveau: 'Primaire',
    icon: <BookOpen size={24} />,
    fraisInscription: '50 000 GNF',
    mensualite: '30 000 GNF',
    anneeScolaire: '330 000 GNF',
    inclus: ['Accès à la plateforme', 'Suivi des résultats', 'Carnet de correspondance', 'Activités parascolaires'],
    popular: false,
  },
  {
    niveau: 'Collège',
    icon: <GraduationCap size={24} />,
    fraisInscription: '75 000 GNF',
    mensualite: '45 000 GNF',
    anneeScolaire: '495 000 GNF',
    inclus: ['Accès à la plateforme', 'Suivi des résultats', 'Carnet de correspondance', 'Activités parascolaires', 'Orientation scolaire'],
    popular: true,
  },
  {
    niveau: 'Lycée',
    icon: <Award size={24} />,
    fraisInscription: '100 000 GNF',
    mensualite: '60 000 GNF',
    anneeScolaire: '660 000 GNF',
    inclus: ['Accès à la plateforme', 'Suivi des résultats', 'Carnet de correspondance', 'Activités parascolaires', 'Orientation scolaire', 'Préparation au Bac'],
    popular: false,
  },
];

const faq = [
  {
    q: 'Comment inscrire mon enfant ?',
    a: "Rendez-vous au secrétariat avec les pièces requises (extrait de naissance, bulletins scolaires de l'année précédente, photos d'identité) ou remplissez le formulaire en ligne."
  },
  {
    q: 'Les frais sont-ils payables en plusieurs fois ?',
    a: "Oui, les frais de scolarité sont payables mensuellement. Des arrangements trimestriels sont aussi possibles sur demande au bureau de la direction."
  },
  {
    q: 'Y a-t-il une cantine scolaire ?',
    a: "Oui, notre cantine propose des repas équilibrés à des tarifs raisonnables. Le service est optionnel et peut être activé lors de l'inscription."
  },
  {
    q: 'Quand commencent les cours ?',
    a: "Les cours commencent en septembre conformément au calendrier scolaire officiel. La rentrée exacte est communiquée chaque année en août."
  },
];

/* ─── PAGE ──────────────────────────────────────────── */
export default function SchoolInfoPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sip">
      {/* ─── HEADER ─── */}
      <header className="sip__header">
        <nav className={`sip__nav${scrolled ? ' sip__nav--scrolled' : ''}`}>
          <Link to="/" className="sip__back">
            <ArrowLeft size={18} /> Retour à l'accueil
          </Link>
          <Link to="/annonces" className="sip__back" style={{ marginLeft: 'auto', marginRight: '1rem' }}>
            Annonces
          </Link>
          <img src="/images/logo_boubacar.png" alt="Logo" className="sip__nav-logo" />
        </nav>
        <div className="sip__hero">
          <span className="sip__hero-badge">
            <Users size={16} /> Groupe Scolaire Privé
          </span>
          <h1 className="sip__hero-title">
            GSP Elhadj Mamadou<br />
            <span className="sip__hero-accent">Saïdou Diallo</span>
          </h1>
          <p className="sip__hero-sub">
            Du primaire au lycée — Excellence, Rigueur et Épanouissement
          </p>
        </div>
        <div className="sip__hero-wave">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc"/>
          </svg>
        </div>
      </header>

      <main className="sip__main">

        {/* ─── CONTACTS ─── */}
        <section className="sip__section" id="contact">
          <div className="sip__section-label">
            <Phone size={16} /> Contact &amp; Localisation
          </div>
          <h2 className="sip__section-title">Nous contacter</h2>
          <p className="sip__section-sub">Notre équipe est disponible pour répondre à toutes vos questions.</p>

          <div className="sip__contact-grid">
            {contacts.map((c, i) => (
              <div className="sip__contact-card" key={i}>
                <div className="sip__contact-icon">{c.icon}</div>
                <div>
                  <p className="sip__contact-label">{c.label}</p>
                  <p className="sip__contact-value">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="sip__map-placeholder">
            <MapPin size={32} color="#0A2F6B" />
            <p>Conakry, Guinée — Carte interactive bientôt disponible</p>
          </div>
        </section>

        {/* ─── NIVEAUX ─── */}
        <section className="sip__section sip__section--alt" id="scolarite">
          <div className="sip__section-label">
            <GraduationCap size={16} /> Scolarité
          </div>
          <h2 className="sip__section-title">Niveaux d'enseignement</h2>
          <p className="sip__section-sub">Nous accueillons les élèves du Cours Préparatoire jusqu'à la Terminale.</p>

          <div className="sip__levels-grid">
            {niveaux.map((n, i) => (
              <div className="sip__level-card" key={i} style={{ '--level-color': n.color }}>
                <div className="sip__level-icon">{n.icon}</div>
                <h3>{n.niveau}</h3>
                <p className="sip__level-classes">{n.classes}</p>
                <p className="sip__level-desc">{n.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TARIFS ─── */}
        <section className="sip__section" id="tarifs">
          <div className="sip__section-label">
            <CreditCard size={16} /> Tarification
          </div>
          <h2 className="sip__section-title">Frais de scolarité</h2>
          <p className="sip__section-sub">Des tarifs transparents pour chaque niveau d'enseignement.</p>

          <div className="sip__pricing-grid">
            {tarifs.map((t, i) => (
              <div className={`sip__pricing-card${t.popular ? ' sip__pricing-card--popular' : ''}`} key={i}>
                {t.popular && <div className="sip__pricing-badge"><Star size={14} /> Plus populaire</div>}
                <div className="sip__pricing-icon">{t.icon}</div>
                <h3 className="sip__pricing-niveau">{t.niveau}</h3>

                <div className="sip__pricing-rows">
                  <div className="sip__pricing-row">
                    <span>Frais d'inscription</span>
                    <strong>{t.fraisInscription}</strong>
                  </div>
                  <div className="sip__pricing-row">
                    <span>Mensualité</span>
                    <strong>{t.mensualite}</strong>
                  </div>
                  <div className="sip__pricing-row sip__pricing-row--total">
                    <span>Année scolaire</span>
                    <strong>{t.anneeScolaire}</strong>
                  </div>
                </div>

                <ul className="sip__pricing-inclus">
                  {t.inclus.map((item, j) => (
                    <li key={j}><CheckCircle size={16} color="#10b981" /> {item}</li>
                  ))}
                </ul>

                <div className="sip__pricing-note">
                  <MapPin size={14} /> Inscription au secrétariat de l'école
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="sip__section sip__section--alt" id="faq">
          <div className="sip__section-label">
            <BookOpen size={16} /> Questions fréquentes
          </div>
          <h2 className="sip__section-title">FAQ</h2>
          <p className="sip__section-sub">Les réponses aux questions les plus fréquentes des parents.</p>

          <div className="sip__faq">
            {faq.map((item, i) => (
              <div
                className={`sip__faq-item${openFaq === i ? ' open' : ''}`}
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="sip__faq-q">
                  {item.q}
                  <ChevronRight size={20} className="sip__faq-arrow" />
                </div>
                <div className="sip__faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="sip__cta-section">
          <h2>Venez nous rendre visite</h2>
          <p>Les inscriptions se font directement au secrétariat de l'établissement. Notre équipe vous accueille du lundi au vendredi de 7h30 à 17h00.</p>
          <div className="sip__cta-btns">
            <a href="tel:+224629403019" className="sip__btn sip__btn--outline">
              <Phone size={18} /> Appeler le secrétariat
            </a>
            <a href="mailto:samakedelamou858@gmail.com" className="sip__btn sip__btn--primary">
              <Mail size={18} /> Envoyer un email
            </a>
          </div>
        </section>

      </main>

      <footer className="sip__footer">
        <img src="/images/logo_boubacar.png" alt="Logo" className="sip__footer-logo" />
        <p>© {new Date().getFullYear()} GSP Elhadj Mamadou Saïdou Diallo — Tous droits réservés</p>
        <Link to="/">Retour à l'accueil</Link>
      </footer>

      {/* Chatbot flottant */}
      <Chatbot />
    </div>
  );
}
