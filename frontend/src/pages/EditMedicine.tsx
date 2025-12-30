import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { Pill, Upload, X, Clock, Calendar, Save } from "lucide-react";

interface Medicine {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  imageContentType?: string;
  frequency: number;
  durationDays: number;
  startTime: string;
}

export default function EditMedicine() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState(8);
  const [durationDays, setDurationDays] = useState(7);
  const [image, setImage] = useState<string | null>(null);
  const [imageContentType, setImageContentType] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [regenerateDoses, setRegenerateDoses] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    try {
      const response = await api.get<Medicine>(`/medicines/${id}`);
      const medicine = response.data;
      setName(medicine.name);
      setDescription(medicine.description || "");
      setFrequency(medicine.frequency);
      setDurationDays(medicine.durationDays || 30);
      if (medicine.image) {
        setImage(medicine.image);
        setImageContentType(medicine.imageContentType || "");
        setImagePreview(
          `data:${medicine.imageContentType};base64,${medicine.image}`
        );
      }
    } catch (err: any) {
      setError("Error al cargar el medicamento");
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no puede ser mayor a 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImage(base64);
        setImageContentType(file.type);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageContentType("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.put(`/medicines/${id}`, {
        name,
        description,
        image,
        imageContentType,
        frequency,
        durationDays,
        regenerateDoses,
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al actualizar medicamento"
      );
    } finally {
      setLoading(false);
    }
  };

  const frequencyOptions = [
    { value: 4, label: "Cada 4 horas" },
    { value: 6, label: "Cada 6 horas" },
    { value: 8, label: "Cada 8 horas" },
    { value: 12, label: "Cada 12 horas" },
    { value: 24, label: "Una vez al día" },
  ];

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Pill className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Medicamento
            </h1>
            <p className="text-gray-500">Modifica los datos del medicamento</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del Medicamento
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Subir</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="text-sm text-gray-500">
                <p>Formatos: JPG, PNG, GIF</p>
                <p>Máximo: 5MB</p>
              </div>
            </div>
          </div>

          {/* Medicine Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Medicamento *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ej: Paracetamol 500mg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Ej: Para el dolor de cabeza, tomar con alimentos..."
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>¿Cada cuánto se toma? *</span>
              </div>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {frequencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFrequency(option.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    frequency === option.value
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <div className="col-span-2 sm:col-span-1">
                <input
                  type="number"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="input-field text-center"
                  min="1"
                  max="168"
                  placeholder="Horas"
                />
                <p className="text-xs text-gray-500 text-center mt-1">
                  Personalizado (horas)
                </p>
              </div>
            </div>
          </div>

          {/* Duration in Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>¿Por cuántos días? *</span>
              </div>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[3, 5, 7, 10, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    durationDays === days
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  {days} días
                </button>
              ))}
              <div>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="input-field text-center"
                  min="1"
                  max="365"
                  placeholder="Días"
                />
                <p className="text-xs text-gray-500 text-center mt-1">
                  Personalizado
                </p>
              </div>
            </div>
          </div>

          {/* Regenerate Doses Option */}
          <div className="bg-orange-50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={regenerateDoses}
                onChange={(e) => setRegenerateDoses(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-orange-900">
                  Regenerar dosis futuras
                </span>
                <p className="text-sm text-orange-700 mt-1">
                  Marca esta opción si cambiaste la frecuencia o duración y
                  quieres recalcular las dosis pendientes. Las dosis ya tomadas
                  se mantendrán.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-secondary py-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
