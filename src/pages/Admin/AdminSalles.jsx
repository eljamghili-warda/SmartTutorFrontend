// src/pages/Admin/AdminSalles.jsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Header from '../../components/Header/Header';
import { Card, Btn, Badge, Spinner, EmptyState, ToastContainer } from '../../components/UI';
import { useToast } from '../../hooks/useToast';

export default function AdminSalles() {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, success, error } = useToast();

  useEffect(() => {
    adminAPI.getSallesAdmin()
      .then(res => setSalles(res.data))
      .catch(() => error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  const fermerSalle = async (id) => {
    try {
      await adminAPI.fermerSalle(id);
      setSalles(prev => prev.filter(s => s.id !== id));
      success('Salle fermée');
    } catch {
      error('Erreur');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  return (
    <>
      <Header title="Gestion des salles" />
      <ToastContainer toasts={toasts} />
      <div className="p-6">
        {salles.length === 0 ? (
          <EmptyState title="Aucune salle" message="Aucune salle trouvée" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salles.map(salle => (
              <Card key={salle.id}>
                <h3 className="font-bold text-white">{salle.nom}</h3>
                <p className="text-sm text-slate-500 mt-1">{salle.type}</p>
                <div className="flex justify-end mt-3">
                  <Btn variant="danger" size="sm" onClick={() => fermerSalle(salle.id)}>Fermer</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}