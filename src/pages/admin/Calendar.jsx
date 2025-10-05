// src/pages/admin/Calendar.jsx
import { useEffect, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";

const localizer = momentLocalizer(moment);

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  // ✅ Load events from Firebase schedules (view only)
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
          color: data[key].color || "#4285F4",
        }));
        setEvents(loadedEvents);
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Show details on click
  const handleSelectEvent = (event) => {
    alert(
      `📌 ${event.title}\n🗓 Start: ${event.start.toLocaleString()}\n🕒 End: ${event.end.toLocaleString()}`
    );
  };

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

      <div style={{ height: "75vh" }} className="border rounded shadow">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          eventPropGetter={eventStyleGetter}
          selectable={false} // ❌ disable slot selection
          resizable={false} // ❌ disable resize
          onSelectEvent={handleSelectEvent} // ✅ show info only
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view)}
          view={currentView}
        />
      </div>
    </div>
  );
}
