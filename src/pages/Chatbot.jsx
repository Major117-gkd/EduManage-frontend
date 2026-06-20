import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import './Chatbot.css';

/* ─── BASE DE CONNAISSANCES ─────────────────────────── */
const KB = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'bjr'],
    reply: 'Bonjour ! Je suis l\'assistant du GSP Elhadj Mamadou Saïdou Diallo. Comment puis-je vous aider ? Vous pouvez me poser des questions sur les contacts, la scolarité, les tarifs ou les inscriptions.'
  },
  {
    keywords: ['téléphone', 'telephone', 'appeler', 'numéro', 'numero', 'appel'],
    reply: 'Vous pouvez nous joindre au : +224 000 00 00 00\nHoraires : Lundi – Vendredi, 7h30 à 17h00.'
  },
  {
    keywords: ['email', 'mail', 'courriel', 'adresse mail'],
    reply: 'Notre adresse email est : contact@gsp-diallo.edu.gn\nNous répondons généralement sous 24h ouvrables.'
  },
  {
    keywords: ['adresse', 'où', 'localisation', 'situation', 'situé', 'situe', 'trouver'],
    reply: 'L\'établissement est situé à Conakry, Guinée. Pour plus de précisions, contactez le secrétariat au +224 000 00 00 00.'
  },
  {
    keywords: ['horaire', 'heure', 'ouverture', 'fermeture', 'quand'],
    reply: 'Le secrétariat est ouvert du Lundi au Vendredi de 7h30 à 17h00.'
  },
  {
    keywords: ['inscri', 'inscription', 'intégrer', 'integrer', 'rejoindre', 'dossier'],
    reply: 'Les inscriptions se font directement au secrétariat de l\'établissement. Munissez-vous de :\n• Extrait de naissance\n• Bulletins scolaires de l\'année précédente\n• Photos d\'identité\n\nContactez-nous au +224 000 00 00 00 pour plus d\'informations.'
  },
  {
    keywords: ['primaire', 'cp', 'ce1', 'ce2', 'cm1', 'cm2'],
    reply: 'Niveau Primaire : CP, CE1, CE2, CM1, CM2.\n\nFrais d\'inscription : 50 000 GNF\nMensualité : 30 000 GNF\nTotal année scolaire : 330 000 GNF'
  },
  {
    keywords: ['collège', 'college', '6eme', '5eme', '4eme', '3eme', '6ème', '5ème', '4ème', '3ème'],
    reply: 'Niveau Collège : 6ème, 5ème, 4ème, 3ème.\n\nFrais d\'inscription : 75 000 GNF\nMensualité : 45 000 GNF\nTotal année scolaire : 495 000 GNF'
  },
  {
    keywords: ['lycée', 'lycee', '2nde', '1ere', '1ère', 'terminale', 'bac', 'baccalauréat'],
    reply: 'Niveau Lycée : 2nde, 1ère, Terminale.\n\nFrais d\'inscription : 100 000 GNF\nMensualité : 60 000 GNF\nTotal année scolaire : 660 000 GNF'
  },
  {
    keywords: ['tarif', 'prix', 'cout', 'coût', 'frais', 'scolarité', 'scolarite', 'payer', 'paiement'],
    reply: 'Voici un résumé des frais de scolarité :\n\nPrimaire : 30 000 GNF/mois (inscription : 50 000 GNF)\nCollège : 45 000 GNF/mois (inscription : 75 000 GNF)\nLycée : 60 000 GNF/mois (inscription : 100 000 GNF)\n\nLes frais sont payables mensuellement. Des arrangements trimestriels sont possibles.'
  },
  {
    keywords: ['mensualité', 'mensualite', 'mensuel', 'mois'],
    reply: 'Les frais sont payables chaque mois. Des arrangements trimestriels sont aussi possibles sur demande au bureau de la direction.'
  },
  {
    keywords: ['cantine', 'repas', 'nourriture', 'déjeuner'],
    reply: 'Oui, une cantine scolaire est disponible. Elle propose des repas équilibrés à des tarifs raisonnables. Le service est optionnel, activable lors de l\'inscription.'
  },
  {
    keywords: ['rentrée', 'rentree', 'septembre', 'début', 'debut', 'commence', 'démarrage'],
    reply: 'Les cours démarrent en septembre, conformément au calendrier scolaire officiel de la Guinée. La date exacte est communiquée chaque année en août.'
  },
  {
    keywords: ['niveaux', 'niveau', 'classe', 'classes', 'filières', 'section'],
    reply: 'Nous accueillons les élèves du primaire jusqu\'au lycée :\n\n• Primaire : CP → CM2\n• Collège : 6ème → 3ème\n• Lycée : 2nde → Terminale'
  },
  {
    keywords: ['merci', 'thanks', 'parfait', 'super', 'ok', 'bien', 'génial'],
    reply: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. Bonne journée !'
  },
  {
    keywords: ['au revoir', 'bye', 'à bientôt', 'bientot'],
    reply: 'Au revoir ! L\'équipe du GSP vous souhaite une excellente journée.'
  },
];

function findReply(message) {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of KB) {
    for (const kw of entry.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) return entry.reply;
    }
  }
  return 'Je ne suis pas sûr de comprendre votre question. Vous pouvez me demander des informations sur :\n• Les contacts et horaires\n• Les niveaux d\'enseignement\n• Les frais de scolarité\n• Les inscriptions';
}

const SUGGESTIONS = [
  'Quels sont les tarifs ?',
  'Comment inscrire mon enfant ?',
  'Vos horaires d\'ouverture ?',
  'Quels niveaux proposez-vous ?',
];

/* ─── COMPOSANT ─────────────────────────────────────── */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Bonjour ! Je suis l\'assistant virtuel du GSP Elhadj Mamadou Saïdou Diallo. Posez-moi vos questions sur l\'école !'
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function send(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setTyping(true);

    setTimeout(() => {
      const reply = findReply(msg);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      setTyping(false);
    }, 800);
  }

  return (
    <>
      {/* ── BULLE FLOTTANTE ── */}
      <button
        className={`chatbot__bubble${open ? ' chatbot__bubble--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir le chat"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && <span className="chatbot__bubble-dot" />}
      </button>

      {/* ── FENÊTRE DE CHAT ── */}
      <div className={`chatbot__window${open ? ' chatbot__window--open' : ''}`}>
        {/* Header */}
        <div className="chatbot__header">
          <div className="chatbot__header-avatar">
            <Bot size={20} />
          </div>
          <div>
            <p className="chatbot__header-name">Assistant GSP</p>
            <p className="chatbot__header-status">
              <span className="chatbot__status-dot" /> En ligne
            </p>
          </div>
          <button className="chatbot__close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot__messages">
          {messages.map((m, i) => (
            <div key={i} className={`chatbot__msg chatbot__msg--${m.from}`}>
              {m.from === 'bot' && (
                <div className="chatbot__msg-avatar"><Bot size={14} /></div>
              )}
              <div className="chatbot__msg-bubble">
                {m.text.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
              {m.from === 'user' && (
                <div className="chatbot__msg-avatar chatbot__msg-avatar--user"><User size={14} /></div>
              )}
            </div>
          ))}

          {typing && (
            <div className="chatbot__msg chatbot__msg--bot">
              <div className="chatbot__msg-avatar"><Bot size={14} /></div>
              <div className="chatbot__typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="chatbot__suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="chatbot__suggestion" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chatbot__input-row">
          <input
            className="chatbot__input"
            type="text"
            placeholder="Posez votre question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="chatbot__send" onClick={() => send()} disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
