import React, { useState } from 'react';
import {
  Flame,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  X,
  CreditCard,
  Truck
} from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleNavigateToMenu = () => {
    setCurrentTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCategories = () => {
    setCurrentTab('menu');
    setTimeout(() => {
      const catEl = document.getElementById('categories-bar');
      if (catEl) {
        catEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 transition-colors">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
            
            {/* Column 1: Brand & Slogan & Presentation (md:col-span-5) */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-2xl tracking-tight text-white font-sans">
                    BEBBA<span className="text-emerald-500">.</span>
                  </span>
                  <span className="block text-xs uppercase font-bold tracking-widest text-emerald-400">
                    Healthy Food
                  </span>
                </div>
              </div>

              <div className="inline-block bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full">
                <p className="text-xs font-semibold text-emerald-300 italic tracking-wide">
                  « Vos Plats santé en un clic »
                </p>
              </div>

              <p className="text-sm leading-relaxed text-stone-400 max-w-md">
                Des repas équilibrés préparés après commande et livrés chez vous, dans le respect de la fraîcheur et de la transparence nutritionnelle.
              </p>

              <div className="flex items-center gap-2 pt-2 text-xs text-stone-400">
                <span className="inline-flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  100% Ingrédients frais
                </span>
                <span className="inline-flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Macros détaillées
                </span>
              </div>
            </div>

            {/* Column 2: Navigation (md:col-span-3) */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 border-b border-stone-800 pb-2">
                Navigation
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={handleNavigateToMenu}
                    className="text-stone-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-emerald-400 transition-colors"></span>
                    Menu
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleNavigateToCategories}
                    className="text-stone-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-emerald-400 transition-colors"></span>
                    Catégories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowConceptModal(true)}
                    className="text-stone-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-emerald-400 transition-colors"></span>
                    Le concept
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="text-stone-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-emerald-400 transition-colors"></span>
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Horaires (md:col-span-4) */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 border-b border-stone-800 pb-2">
                Contact
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-stone-400">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Adresse du restaurant — à confirmer</span>
                </div>

                <div className="flex items-center gap-3 text-stone-400">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href="tel:+21600000000"
                    className="hover:text-emerald-400 transition-colors font-mono"
                  >
                    +216 00 000 000
                  </a>
                </div>

                <div className="flex items-center gap-3 text-stone-400">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href="mailto:contact@bebba.tn"
                    className="hover:text-emerald-400 transition-colors font-mono"
                  >
                    contact@bebba.tn
                  </a>
                </div>

                <div className="flex items-start gap-3 text-stone-400 pt-1">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Lundi – Dimanche · 11h00 – 22h30</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment/Tracking Info */}
        <div className="border-t border-stone-800 bg-stone-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-stone-400">
            <div>
              © 2026 BEBBA Healthy Food — Tous droits réservés
            </div>

            <div className="flex items-center gap-2 font-medium text-stone-300">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paiement à la livraison (COD)</span>
              <span className="text-stone-600">·</span>
              <Truck className="w-3.5 h-3.5 text-teal-400" />
              <span>Suivi de commande en temps réel</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Le Concept Modal */}
      {showConceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowConceptModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Le Concept BEBBA</h3>
                <p className="text-xs text-emerald-400 font-medium">« Vos Plats santé en un clic »</p>
              </div>
            </div>

            <p className="text-sm text-stone-300 leading-relaxed mb-6">
              Des repas équilibrés préparés après commande et livrés chez vous, dans le respect de la fraîcheur et de la transparence nutritionnelle.
            </p>

            <div className="space-y-3.5 text-xs text-stone-300">
              <div className="flex items-start gap-3 bg-stone-800/60 p-3 rounded-xl border border-stone-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-0.5">Préparation à la commande</strong>
                  Aucun plat préparé à l'avance. Chaque salade, bowl ou plat chaud est cuisiné à la minute dès validation du bon de cuisine.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-800/60 p-3 rounded-xl border border-stone-700/50">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-0.5">Transparence nutritionnelle</strong>
                  Chaque recette affiche précisément ses calories, protéines, glucides et lipides pour vous aider à atteindre vos objectifs santé.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-800/60 p-3 rounded-xl border border-stone-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-0.5">Livraison rapide & Paiement COD</strong>
                  Suivez votre livreur en temps réel sur carte GPS et réglez en toute sécurité à la livraison en espèces.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => {
                  setShowConceptModal(false);
                  handleNavigateToMenu();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
              >
                Découvrir la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Contactez BEBBA</h3>
                <p className="text-xs text-stone-400">Service client & Restaurant</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-stone-300">
              <div className="p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase font-semibold">Localisation</div>
                  <div className="text-white font-medium">Adresse du restaurant — à confirmer</div>
                </div>
              </div>

              <div className="p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50 flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs text-stone-400 uppercase font-semibold">Téléphone</div>
                  <a href="tel:+21600000000" className="text-white font-mono hover:text-emerald-400 transition font-medium">
                    +216 00 000 000
                  </a>
                </div>
              </div>

              <div className="p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50 flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs text-stone-400 uppercase font-semibold">Email</div>
                  <a href="mailto:contact@bebba.tn" className="text-white font-mono hover:text-emerald-400 transition font-medium">
                    contact@bebba.tn
                  </a>
                </div>
              </div>

              <div className="p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase font-semibold">Horaires d'ouverture</div>
                  <div className="text-white font-medium">Lundi – Dimanche · 11h00 – 22h30</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
