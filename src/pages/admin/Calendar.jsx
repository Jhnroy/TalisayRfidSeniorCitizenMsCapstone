// src/pages/admin/Calendar.jsx
import { useEffect, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

const localizer = momentLocalizer(moment);

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  // Load events from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("calendar-events");
    if (stored) {
      const parsed = JSON.parse(stored);
      const fixed = parsed.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      setEvents(fixed);
    }
  }, []);

  // Save events to localStorage (in case of deletion)
  useEffect(() => {
    localStorage.setItem("calendar-events", JSON.stringify(events));
  }, [events]);

  const handleSelectEvent = (event) => {
    alert(
      `📅 ${event.title}\n🕒 From: ${event.start.toLocaleString()}\nTo: ${event.end.toLocaleString()}`
    );
  };

  const handleEventDelete = (event) => {
    const confirmDelete = window.confirm(`Delete event: "${event.title}"?`);
    if (confirmDelete) {
      const updated = events.filter((e) => e !== event);
      setEvents(updated);
    }
  };

  // Navigation controls
  const handleNavigate = (action) => {
    const newDate = (() => {
      switch (action) {
        case "TODAY":
          return new Date();
        case "PREV":
          return moment(currentDate).subtract(1, currentView).toDate();
        case "NEXT":
          return moment(currentDate).add(1, currentView).toDate();
        default:
          return currentDate;
      }
    })();
    setCurrentDate(newDate);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>

      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleNavigate("TODAY")}
          className="bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-700"
        >
          Today
        </button>
        <button
          onClick={() => handleNavigate("PREV")}
          className="bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-700"
        >
          ← Back
        </button>
        <button
          onClick={() => handleNavigate("NEXT")}
          className="bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-700"
        >
          Next →
        </button>
      </div>

      {/* Calendar Display */}
      <div style={{ height: "75vh" }} className="border rounded shadow">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          onDoubleClickEvent={handleEventDelete}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view)}
          view={currentView}
        />
      </div>
    </div>
  );
}
