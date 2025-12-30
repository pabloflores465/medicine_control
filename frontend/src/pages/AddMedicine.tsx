import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Pill, Upload, X, Clock, Calendar } from "lucide-react";

export default function AddMedicine() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState(8);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [image, setImage] = useState<string | null>(null);
  const [imageContentType, setImageContentType] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      const startDateTime = new Date(`${startDate}T${startTime}`);

      await api.post("/medicines", {
        name,
        description,
        image,
        imageContentType,
        frequency,
        startTime: startDateTime.toISOString(),
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agregar medicamento");
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
              Agregar Medicamento
            </h1>
            <p className="text-gray-500">
              Registra un nuevo medicamento para llevar su control
            </p>
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

          {/* Start Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de inicio *</span>
                </div>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Hora de primera toma *</span>
                </div>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Next Dose Preview */}
          <div className="bg-primary-50 rounded-xl p-4">
            <h3 className="font-medium text-primary-900 mb-2">
              Próximas tomas calculadas:
            </h3>
            <div className="text-sm text-primary-700 space-y-1">
              {[0, 1, 2].map((i) => {
                const nextDose = new Date(`${startDate}T${startTime}`);
                nextDose.setHours(nextDose.getHours() + frequency * i);
                return (
                  <p key={i}>
                    {i === 0 ? "1ª" : i === 1 ? "2ª" : "3ª"} toma:{" "}
                    {nextDose.toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    a las{" "}
                    {nextDose.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </span>
              ) : (
                "Guardar Medicamento"
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
