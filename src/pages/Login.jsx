import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Handshake, Heart, BookOpen, Star, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/teacher');
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Image/Branding */}
      <div className="login-left">
        <div className="login-left-overlay">
          <Link to="/" className="login-back-home">
             <ArrowLeft size={18} /> Retour à l'accueil
          </Link>
          <div className="login-branding">
            <div className="login-logo-container">
              <img src="/images/logo_boubacar.png" alt="Logo École" className="login-logo-svg" style={{ objectFit: 'contain', borderRadius: '50%' }} />
              <div className="login-brand-text">
                <h2 style={{ fontSize: '1.2rem' }}>GSP Elhadj Mamadou Saïdou Diallo</h2>
                <p>Du primaire au lycée</p>
              </div>
            </div>
            
            <h1 className="login-hero-title">
              Excellence,<br />
              Rigueur et<br />
              Épanouissement.
            </h1>

            <div className="login-features">
              <div className="login-feature">
                <span className="feature-icon"><Handshake size={24} /></span>
                <span>Inclusif</span>
              </div>
              <div className="login-feature">
                <span className="feature-icon"><Heart size={24} /></span>
                <span>Bienveillant</span>
              </div>
              <div className="login-feature">
                <span className="feature-icon"><BookOpen size={24} /></span>
                <span>Professionnel</span>
              </div>
              <div className="login-feature">
                <span className="feature-icon"><Star size={24} /></span>
                <span>Épanouissant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header-mobile">
            <img src="/images/logo_boubacar.png" alt="Logo École" className="login-logo-mobile" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%' }} />
            <div className="login-brand-text-mobile">
              <h2>École Spéciale</h2>
              <p>Excellence et Inclusion</p>
            </div>
          </div>

          <div className="login-welcome">
            <h2>Bienvenue !</h2>
            <p>Connectez-vous à votre espace pour continuer.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">Adresse e-mail</label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={18} /></span>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre adresse e-mail" 
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={18} /></span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Entrez votre mot de passe" 
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            <button type="submit" className="btn-login">
              <span className="btn-icon"><ArrowRight size={18} /></span> Se connecter
            </button>
          </form>

          <p className="login-footer">
            Vous n'avez pas de compte ? <Link to="/inscription">Demander l'accès</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
