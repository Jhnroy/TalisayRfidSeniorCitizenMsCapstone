// src/pages/admin/Calendar.jsx
import { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { FaPlus, FaTrash, FaEdit, FaPalette } from "react-icons/fa";
import moment from "moment";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

// Predefined Google-like colors
const COLORS = [
  { name: "Blue", value: "#4285F4" },
  { name: "Green", value: "#34A853" },
  { name: "Red", value: "#EA4335" },
  { name: "Yellow", value: "#FBBC05" },
  { name: "Purple", value: "#A142F4" },
];

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Load events from Firebase
  useEffect(() => {
    const eventsRef = ref(rtdb, "schedules");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedEvents = Object.keys(data).map((key) => ({
          id: key,
          title: data[key].title,
          start: new Date(data[key].start),
          end: new Date(data[key].end),
          color: data[key].color || "#4285F4", // default blue
        }));
        setEvents(loadedEvents);
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Add Event to Firebase
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent.title || !selectedEvent.start || !selectedEvent.end) return;

    const eventsRef = ref(rtdb, "schedules");
    const newEventRef = push(eventsRef);

    await set(newEventRef, {
      title: selectedEvent.title,
      start: selectedEvent.start.toISOString(),
      end: selectedEvent.end.toISOString(),
      color: selectedEvent.color || "#4285F4",
      createdAt: new Date().toISOString(),
    });

    setSelectedEvent(null);
    setIsEditing(false);
  };

  // ✅ Edit Event in Firebase
  const handleEditEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent?.id) return;

    const eventRef = ref(rtdb, `schedules/${selectedEvent.id}`);
    await update(eventRef, {
      title: selectedEvent.title,
      start: selectedEvent.start.toISOString(),
      end: selectedEvent.end.toISOString(),
      color: selectedEvent.color || "#4285F4",
    });

    setSelectedEvent(null);
    setIsEditing(false);
  };

  // ✅ Delete Event
  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    const confirmDelete = window.confirm(`Delete event: "${selectedEvent.title}"?`);
    if (confirmDelete) {
      const eventRef = ref(rtdb, `schedules/${selectedEvent.id}`);
      await remove(eventRef);
      setSelectedEvent(null);
    }
  };

  // ✅ Select existing event → show modal
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEditing(false);
  };

  // ✅ Select empty slot → open modal for new event
  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({
      id: null,
      title: "",
      start,
      end,
      color: "#4285F4",
    });
    setIsEditing(true);
  };

  // ✅ Drag/Drop or Resize Event → update Firebase
  const handleEventDrop = async ({ event, start, end }) => {
    const eventRef = ref(rtdb, `schedules/${event.id}`);
    await update(eventRef, {
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  const handleEventResize = async ({ event, start, end }) => {
    const eventRef = ref(rtdb, `schedules/${event.id}`);
    await update(eventRef, {
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  // ✅ Navigation
  

  // ✅ Colorized events
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || "#4285F4",
        borderRadius: "6px",
        color: "white",
        border: "0px",
        display: "block",
        paddingLeft: "4px",
      },
    };
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>

      {/* Calendar */}
      <div style={{ height: "75vh" }} className="border rounded shadow">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          resizable
          selectable
          eventPropGetter={eventStyleGetter}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view)}
          view={currentView}
        />
      </div>

      {/* Modal (Blurred Background) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
            {isEditing || !selectedEvent.id ? (
              <form
                onSubmit={selectedEvent.id ? handleEditEvent : handleAddEvent}
                className="space-y-3"
              >
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaPalette /> {selectedEvent.id ? "Edit Event" : "Add Event"}
                </h3>
                <input
                  type="text"
                  placeholder="Event Title"
                  className="w-full border rounded p-2"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, title: e.target.value })
                  }
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    className="w-1/2 border rounded p-2"
                    value={moment(selectedEvent.start).format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) =>
                      setSelectedEvent({
                        ...selectedEvent,
                        start: new Date(e.target.value),
                      })
                    }
                    required
                  />
                  <input
                    type="datetime-local"
                    className="w-1/2 border rounded p-2"
                    value={moment(selectedEvent.end).format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) =>
                      setSelectedEvent({
                        ...selectedEvent,
                        end: new Date(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Event Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setSelectedEvent({ ...selectedEvent, color: c.value })
                        }
                        className={`w-6 h-6 rounded-full border-2 ${
                          selectedEvent.color === c.value
                            ? "border-black"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaPlus /> {selectedEvent.id ? "Save" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: selectedEvent.color }}
                >
                  {selectedEvent.title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  📅 {moment(selectedEvent.start).format("MMM DD, YYYY hh:mm A")} –{" "}
                  {moment(selectedEvent.end).format("MMM DD, YYYY hh:mm A")}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
