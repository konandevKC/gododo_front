'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AvailabilityCalendarProps {
  accommodationId: number;
  roomId?: number;
  onDateSelect?: (date: Date) => void;
}

interface CalendarDay {
  date: string;
  status: 'available' | 'occupied' | 'maintenance';
  price?: number;
}

export default function AvailabilityCalendar({ accommodationId, roomId, onDateSelect }: AvailabilityCalendarProps) {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, [accommodationId, roomId, currentMonth]);

  const fetchAvailability = async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    try {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const response = await api.get(
        `/accommodations/${accommodationId}/rooms/${roomId}/calendar`,
        {
          params: {
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
          },
        }
      );

      setCalendar(response.data.calendar || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'occupied':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'maintenance':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Occupé';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'N/A';
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const calendarMap = new Map(calendar.map(day => [day.date, day]));

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (loading) {
    return <div className="text-center py-8">Chargement du calendrier...</div>;
  }

  if (!roomId) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Sélectionnez une chambre pour voir la disponibilité
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = calendarMap.get(dateStr);
          const status = dayData?.status || 'available';
          const isPastDate = isPast(day) && !isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dateStr}
              onClick={() => !isPastDate && onDateSelect?.(day)}
              disabled={isPastDate}
              className={`
                p-2 rounded border text-sm
                ${getStatusColor(status)}
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isPastDate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                ${isToday(day) ? 'ring-2 ring-primary' : ''}
              `}
              title={`${format(day, 'dd/MM/yyyy')} - ${getStatusLabel(status)}`}
            >
              <div>{format(day, 'd')}</div>
              {dayData?.price && (
                <div className="text-xs mt-1">
                  {Math.round(dayData.price).toLocaleString('fr-FR')} FCFA
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span>Occupé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
          <span>Maintenance</span>
        </div>
      </div>
    </div>
  );
}

