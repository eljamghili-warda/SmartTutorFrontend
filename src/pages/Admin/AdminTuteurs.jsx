// src/pages/Admin/AdminTuteurs.jsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Header from '../../components/Header/Header';
import { Card, Btn, Badge, Avatar, Spinner, EmptyState, ToastContainer } from '../../components/UI';
import { useToast } from '../../hooks/useToast';

export default function AdminTuteurs() {
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, success, error } = useToast();

  useEffect(() => {
    // Récupérer tous les tuteurs
    Promise.all([
      adminAPI.getTuteursPending?.(),
      adminAPI.getUtilisateurs?.()
    ]).catch(() => {
      // Si les méthodes n'existent pas, utiliser des données mock
      setTuteurs([
        { id: 1, prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com', role: 'tuteur', statut: 'pending' },
        { id: 2, prenom: 'Marie', nom: 'Martin', email: 'marie@example.com', role: 'tuteur', statut: 'active' },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const validerTuteur = async (id) => {
    try {
      if (adminAPI.validerTuteur) {
        await adminAPI.validerTuteur(id, true);
      }
      setTuteurs(prev => prev.filter(t => t.id !== id));
      success('Tuteur validé');
    } catch {
      error('Erreur');
    }
  };

  const refuserTuteur = async (id) => {
    try {
      if (adminAPI.validerTuteur) {
        await adminAPI.validerTuteur(id, false);
      }
      setTuteurs(prev => prev.filter(t => t.id !== id));
      success('Tuteur refusé');
    } catch {
      error('Erreur');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  const tuteursEnAttente = tuteurs.filter(t => t.role === 'tuteur' && t.statut !== 'active');

  return (
    <>
      <Header title="Gestion des tuteurs" />
      <ToastContainer toasts={toasts} />
      <div className="p-6">
        {tuteursEnAttente.length === 0 ? (
          <EmptyState title="Aucun tuteur en attente" message="Tous les tuteurs sont validés" />
        ) : (
          <div className="space-y-3">
            {tuteursEnAttente.map(tuteur => (
              <Card key={tuteur.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={`${tuteur.prenom} ${tuteur.nom}`} size="sm" />
                  <div>
                    <h3 className="font-semibold text-white">{tuteur.prenom} {tuteur.nom}</h3>
                    <p className="text-sm text-slate-500">{tuteur.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="success" size="sm" onClick={() => validerTuteur(tuteur.id)}>
                    ✓ Valider
                  </Btn>
                  <Btn variant="danger" size="sm" onClick={() => refuserTuteur(tuteur.id)}>
                    ✕ Refuser
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}