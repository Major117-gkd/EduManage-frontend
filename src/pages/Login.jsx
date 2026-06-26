import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Calendar,
  BarChart3,
  Megaphone,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Sun,
  Moon,
  QrCode,
  ChevronDown,
} from 'lucide-react';
import { getHomePathForRole } from '../utils/rolePaths';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import QrLoginModal from '../components/QrLoginModal';
import './Login.css';

const FEATURES = [
  {
    icon: Users,
    label: 'Gestion des élèves',
    desc: 'Suivi complet des élèves et des classes',
    tone: 'blue',
  },
  {
    icon: Calendar,
    label: 'Emploi du temps',
    desc: 'Planning et horaires en toute simplicité',
    tone: 'green',
  },
  {
    icon: BarChart3,
    label: 'Notes et évaluations',
    desc: 'Suivi des notes et des performances',
    tone: 'purple',
  },
  {
    icon: Megaphone,
    label: 'Communication',
    desc: 'Échanges facilités entre l\'école et les utilisateurs',
    tone: 'amber',
  },
];

const PROFILES = [
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'PROFESSEUR', label: 'Professeur' },
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'DIRECTEUR', label: 'Directeur' },
];

const PROFILE_HINTS = {
  ELEVE: {
    label: 'Identifiant (matricule)',
    placeholder: 'Ex : GSP-0001 (carte scolaire)',
    type: 'text',
  },
  PROFESSEUR: {
    label: 'Identifiant ou e-mail',
    placeholder: 'Votre e-mail professionnel',
    type: 'email',
  },
  PARENT: {
    label: 'E-mail parent',
    placeholder: 'E-mail utilisé lors de l\'inscription',
    type: 'email',
  },
  ADMIN: {
    label: 'Identifiant ou e-mail',
    placeholder: 'Votre e-mail administrateur',
    type: 'email',
  },
  COMPTABLE: {
    label: 'E-mail comptable',
    placeholder: 'Votre e-mail professionnel',
    type: 'email',
  },
  DIRECTEUR: {
    label: 'E-mail directeur',
    placeholder: 'Votre e-mail professionnel',
    type: 'email',
  },
};

function profileFromQuery(value) {
  const map = { eleve: 'ELEVE', parent: 'PARENT', professeur: 'PROFESSEUR', admin: 'ADMIN', comptable: 'COMPTABLE', directeur: 'DIRECTEUR' };
  return map[String(value || '').toLowerCase()] || '';
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const [profil, setProfil] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const qrScanLock = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginStudent, loginStudentQr } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const fromQuery = profileFromQuery(searchParams.get('profil'));
    if (fromQuery) setProfil(fromQuery);
  }, [searchParams]);

  const fieldHint = profil ? PROFILE_HINTS[profil] : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!profil) {
      setError('Veuillez sélectionner votre profil.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const redirect = location.state?.from;
      let data;

      if (profil === 'ELEVE') {
        data = await loginStudent(identifier.trim(), password);
        if (data.user.role !== 'ELEVE') {
          setError('Ce compte n\'est pas un espace élève.');
          setLoading(false);
          return;
        }
        navigate(redirect?.startsWith('/student') ? redirect : '/student', { replace: true });
      } else {
        data = await login(identifier.trim(), password);
        if (data.user.role === 'ELEVE') {
          setError('Les élèves doivent sélectionner le profil « Élève » et utiliser leur matricule.');
          setLoading(false);
          return;
        }
        if (profil === 'ADMIN' && data.user.role !== 'ADMIN') {
          setError('Ce compte n\'est pas un administrateur.');
          setLoading(false);
          return;
        }
        if (profil === 'COMPTABLE' && data.user.role !== 'COMPTABLE') {
          setError('Ce compte n\'est pas un comptable.');
          setLoading(false);
          return;
        }
        if (profil === 'DIRECTEUR' && data.user.role !== 'DIRECTEUR') {
          setError('Ce compte n\'est pas un directeur.');
          setLoading(false);
          return;
        }
        if (profil === 'PROFESSEUR' && data.user.role !== 'PROFESSEUR') {
          setError('Ce compte n\'est pas un professeur.');
          setLoading(false);
          return;
        }
        if (profil === 'PARENT' && data.user.role !== 'PARENT') {
          setError('Ce compte n\'est pas un espace parent.');
          setLoading(false);
          return;
        }
        const home = getHomePathForRole(data.user.role);
        const from = location.state?.from;
        if (from && from.startsWith(home)) {
          navigate(from, { replace: true });
        } else {
          navigate(home, { replace: true });
        }
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Identifiants incorrects.');
    }

    setLoading(false);
  };

  const handleQrScan = useCallback(async (qrData) => {
    if (qrScanLock.current || qrLoading) return;
    qrScanLock.current = true;
    setQrLoading(true);
    setQrError('');

    try {
      const data = await loginStudentQr(qrData);
      if (data.user.role !== 'ELEVE') {
        setQrError('Ce QR code n\'est pas un espace élève.');
        qrScanLock.current = false;
        return;
      }
      setQrOpen(false);
      const redirect = location.state?.from;
      navigate(redirect?.startsWith('/student') ? redirect : '/student', { replace: true });
    } catch (err) {
      setQrError(err.data?.error || err.message || 'Connexion QR impossible.');
      qrScanLock.current = false;
    } finally {
      setQrLoading(false);
    }
  }, [loginStudentQr, navigate, location.state?.from]);

  const openQrModal = () => {
    if (profil !== 'ELEVE') {
      setError('La connexion QR est réservée aux élèves. Sélectionnez le profil « Élève ».');
      return;
    }
    setQrError('');
    qrScanLock.current = false;
    setQrOpen(true);
  };

  return (
    <div className="login-page">
      <div className="login-page__left">
        <Link to="/" className="login-page__back">
          <ArrowLeft size={18} />
          Retour à l&apos;accueil
        </Link>

        <div className="login-page__left-inner">
          <div className="login-page__brand">
            <div className="login-page__brand-icon">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="login-page__brand-name">EduManage</div>
              <div className="login-page__brand-sub">Gestion scolaire</div>
            </div>
          </div>

          <h1 className="login-page__hero-title">
            Bienvenue sur EduManage
            <span>Votre plateforme de gestion scolaire</span>
          </h1>
          <p className="login-page__hero-text">
            Connectez-vous pour accéder à votre espace et gérer facilement toutes vos activités scolaires.
          </p>

          <div className="login-page__features">
            {FEATURES.map(({ icon: Icon, label, desc, tone }) => (
              <div key={label} className="login-page__feature">
                <div className={`login-page__feature-icon login-page__feature-icon--${tone}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="login-page__secure">
            <Shield size={16} />
            <span>Vos données sont sécurisées et confidentielles</span>
          </div>
        </div>
      </div>

      <div className="login-page__right">
        <button
          type="button"
          className="login-page__theme theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="login-page__card">
          <div className="login-page__card-head">
            <div className="login-page__card-icon">
              <Lock size={28} />
            </div>
            <h2>Connexion</h2>
            <p>Accédez à votre espace</p>
          </div>

          {error && (
            <div className="login-page__error" role="alert">
              {error}
            </div>
          )}

          <form className="login-page__form" onSubmit={handleLogin}>
            <div className="login-page__field">
              <label htmlFor="profil">Profil</label>
              <div className="login-page__input-wrap login-page__input-wrap--select">
                <span className="login-page__input-icon">
                  <User size={18} />
                </span>
                <select
                  id="profil"
                  value={profil}
                  onChange={(e) => {
                    setProfil(e.target.value);
                    setIdentifier('');
                    setError('');
                  }}
                  required
                >
                  <option value="">Sélectionnez votre profil</option>
                  {PROFILES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="login-page__select-chevron" />
              </div>
            </div>

            <div className="login-page__field">
              <label htmlFor="identifier">
                {fieldHint?.label || 'Identifiant ou e-mail'}
              </label>
              <div className="login-page__input-wrap">
                <span className="login-page__input-icon">
                  <User size={18} />
                </span>
                <input
                  type={fieldHint?.type || 'text'}
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={fieldHint?.placeholder || 'Votre identifiant ou e-mail'}
                  autoComplete="username"
                  required
                  disabled={!profil}
                />
              </div>
            </div>

            <div className="login-page__field">
              <label htmlFor="password">Mot de passe</label>
              <div className="login-page__input-wrap">
                <span className="login-page__input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                  disabled={!profil}
                />
                <button
                  type="button"
                  className="login-page__pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Link to="/infos" className="login-page__forgot">
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" className="login-page__submit" disabled={loading || !profil}>
              <LogIn size={18} />
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {profil === 'ELEVE' && (
            <>
              <div className="login-page__divider">ou</div>

              <button
                type="button"
                className="login-page__qr-btn login-page__qr-btn--active"
                onClick={openQrModal}
                disabled={loading || qrLoading}
              >
                <QrCode size={18} />
                Se connecter avec un code QR
              </button>
              <p className="login-page__qr-hint">Scannez le QR code sur votre carte scolaire</p>
            </>
          )}

          <p className="login-page__footer">
            Vous n&apos;avez pas de compte ?{' '}
            <Link to="/infos">Contactez votre administrateur</Link>
          </p>
        </div>
      </div>

      <QrLoginModal
        open={qrOpen}
        onClose={() => !qrLoading && setQrOpen(false)}
        onScan={handleQrScan}
        loading={qrLoading}
        error={qrError}
      />
    </div>
  );
}
