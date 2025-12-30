import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

interface Medicine {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  imageContentType?: string;
  frequency: number;
  startTime: string;
  doses: {
    scheduledTime: string;
    takenAt?: string;
    taken: boolean;
  }[];
  active: boolean;
}

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [takingMedicine, setTakingMedicine] = useState<string | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data);
    } catch (err: any) {
      setError("Error al cargar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  const getNextDose = (medicine: Medicine) => {
    const now = new Date();
    const pendingDose = medicine.doses.find(
      (d) => !d.taken && new Date(d.scheduledTime) > now
    );
    return pendingDose ? new Date(pendingDose.scheduledTime) : null;
  };

  const getPendingDose = (medicine: Medicine) => {
    const now = new Date();
    return medicine.doses.find(
      (d) => !d.taken && new Date(d.scheduledTime) <= now
    );
  };

  const markAsTaken = async (medicineId: string) => {
    setTakingMedicine(medicineId);
    try {
      await api.post(`/medicines/${medicineId}/take`);
      await fetchMedicines();
    } catch (err) {
      setError("Error al marcar como tomado");
    } finally {
      setTakingMedicine(null);
    }
  };

  const deleteMedicine = async (medicineId: string) => {
    if (!confirm("¿Estás seguro de eliminar este medicamento?")) return;
    setDeletingMedicine(medicineId);
    try {
      await api.delete(`/medicines/${medicineId}`);
      await fetchMedicines();
    } catch (err) {
      setError("Error al eliminar medicamento");
    } finally {
      setDeletingMedicine(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `en ${days} día${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) {
      return `en ${hours}h ${minutes}m`;
    }
    return `en ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Mis Medicamentos
        </h1>
        <p className="text-gray-500 mt-1">
          Control y seguimiento de tus medicinas
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {medicines.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes medicamentos registrados
          </h2>
          <p className="text-gray-500 mb-6">
            Comienza agregando tu primer medicamento
          </p>
          <Link
            to="/add-medicine"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Agregar Medicamento
          </Link>
        </div>
      )}

      {/* Medicine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => {
          const nextDose = getNextDose(medicine);
          const pendingDose = getPendingDose(medicine);
          const hasPending = !!pendingDose;

          return (
            <div
              key={medicine._id}
              className={`medicine-card p-6 ${
                hasPending ? "ring-2 ring-orange-400" : ""
              }`}
            >
              {/* Medicine Image */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {medicine.image ? (
                    <img
                      src={`data:${medicine.imageContentType};base64,${medicine.image}`}
                      alt={medicine.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Pill className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {medicine.name}
                  </h3>
                  {medicine.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {medicine.description}
                    </p>
                  )}
                  <p className="text-sm text-primary-600 font-medium mt-1">
                    Cada {medicine.frequency} hora
                    {medicine.frequency > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Next Dose */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                {hasPending ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">¡Dosis pendiente!</span>
                  </div>
                ) : nextDose ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Próxima dosis: </span>
                      <span>{formatTime(nextDose)}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({getTimeUntil(nextDose)})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Todas las dosis completadas</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(hasPending || nextDose) && (
                  <button
                    onClick={() => markAsTaken(medicine._id)}
                    disabled={takingMedicine === medicine._id}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {takingMedicine === medicine._id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Tomando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Tomar</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => deleteMedicine(medicine._id)}
                  disabled={deletingMedicine === medicine._id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingMedicine === medicine._id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
