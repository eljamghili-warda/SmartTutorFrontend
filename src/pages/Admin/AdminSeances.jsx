// src/pages/Admin/AdminSeances.jsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Header from '../../components/Header/Header';
import { Card, Badge, Spinner, EmptyState, ToastContainer } from '../../components/UI';
import { useToast } from '../../hooks/useToast';

export default function AdminSeances() {
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, success, error } = useToast();

  useEffect(() => {
    adminAPI.getSeancesAdmin()
      .then(res => setSeances(res.data))
      .catch(() => error('Erreur chargement des séances'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  return (
    <>
      <Header title="Gestion des séances" />
      <ToastContainer toasts={toasts} />
      <div className="p-6">
        {seances.length === 0 ? (
          <EmptyState title="Aucune séance" message="Aucune séance trouvée" />
        ) : (
          <div className="space-y-3">
            {seances.map(seance => (
              <Card key={seance.id} className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">{seance.titre || `Séance #${seance.id}`}</h3>
                  <p className="text-sm text-slate-500">{seance.salle_nom}</p>
                </div>
                <Badge variant={seance.statut === 'TERMINEE' ? 'success' : seance.statut === 'EN_COURS' ? 'info' : 'default'}>
                  {seance.statut || 'PLANIFIEE'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}