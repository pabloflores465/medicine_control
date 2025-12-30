import { useState, useEffect } from "react";
import api from "../services/api";
import {
  ChevronLeft,
  ChevronRight,
  Pill,
  CheckCircle,
  Clock,
} from "lucide-react";

interface CalendarDose {
  medicineId: string;
  medicineName: string;
  medicineImage?: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/medicines/calendar/data", {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      });
      setCalendarData(response.data);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  };

  const getDosesForDay = (day: number) => {
    return calendarData.filter((dose) => {
      const doseDate = new Date(dose.scheduledTime);
      return doseDate.getDate() === day;
    });
  };

  const getDayStatus = (day: number) => {
    const doses = getDosesForDay(day);
    if (doses.length === 0) return "empty";
    const allTaken = doses.every((d) => d.taken);
    const someTaken = doses.some((d) => d.taken);
    if (allTaken) return "completed";
    if (someTaken) return "partial";
    return "pending";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDayDoses = selectedDay ? getDosesForDay(selectedDay) : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Calendario de Medicamentos
        </h1>
        <p className="text-gray-500 mt-1">
          Visualiza y controla tus tomas de medicamentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-4 md:p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Ir a hoy
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className="calendar-day" />
                  );
                }

                const status = getDayStatus(day);
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected = day === selectedDay;
                const doses = getDosesForDay(day);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`calendar-day p-2 rounded-lg transition-all relative ${
                      isSelected
                        ? "bg-primary-100 ring-2 ring-primary-500"
                        : "hover:bg-gray-50"
                    } ${isToday ? "ring-2 ring-primary-300" : ""}`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-primary-600" : "text-gray-900"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Status Indicators */}
                    {doses.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 justify-center">
                        {status === "completed" && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        {status === "partial" && (
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        )}
                        {status === "pending" && (
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                        <span className="text-xs text-gray-400 hidden md:inline">
                          {doses.length}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">Completado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Day Detail */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDay ? (
              <>
                {selectedDay} de {monthNames[currentDate.getMonth()]}
              </>
            ) : (
              "Selecciona un día"
            )}
          </h3>

          {!selectedDay ? (
            <div className="text-center py-8 text-gray-400">
              <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Haz clic en un día para ver las tomas programadas</p>
            </div>
          ) : selectedDayDoses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay medicamentos programados para este día</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedDayDoses
                .sort(
                  (a, b) =>
                    new Date(a.scheduledTime).getTime() -
                    new Date(b.scheduledTime).getTime()
                )
                .map((dose, index) => (
                  <div
                    key={`${dose.medicineId}-${index}`}
                    className={`p-3 rounded-xl border ${
                      dose.taken
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {dose.medicineImage ? (
                          <img
                            src={`data:image/jpeg;base64,${dose.medicineImage}`}
                            alt={dose.medicineName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Pill className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {dose.medicineName}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3" />
                          <span className="text-gray-500">
                            {formatTime(dose.scheduledTime)}
                          </span>
                        </div>
                      </div>
                      {dose.taken ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                    </div>
                    {dose.taken && dose.takenAt && (
                      <p className="text-xs text-green-600 mt-2 ml-13">
                        Tomado a las {formatTime(dose.takenAt)}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
