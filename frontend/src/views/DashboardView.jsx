import { Calendar, ChevronRight, Clock, X } from 'lucide-react';
import { useState } from 'react';
import './ActiveEvent.css';

const ActiveEventClean = () => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  const allEvents = [
    { id: 1, date: '2026-01-08', time: '10:00 AM', timezone: '869Z', location: 'Main Entrance' },
    { id: 2, date: '2026-01-09', time: '2:00 PM', timezone: '869Z', location: 'Conference Room A' },
    { id: 3, date: '2026-01-10', time: '11:00 PM', timezone: '869Z', location: 'Lobby Area' },
    { id: 4, date: '2026-01-07', time: '9:00 AM', timezone: '869Z', location: 'Reception Desk' },
    { id: 5, date: '2026-01-11', time: '3:30 PM', timezone: '869Z', location: 'Security Gate' },
    { id: 6, date: '2026-01-12', time: '8:15 AM', timezone: '869Z', location: 'Parking Entrance' },
    { id: 7, date: '2026-01-13', time: '1:45 PM', timezone: '869Z', location: 'Building B' },
    { id: 8, date: '2026-01-14', time: '4:20 PM', timezone: '869Z', location: 'VIP Lounge' },
  ];

  const displayedEvents = showAllEvents ? allEvents : allEvents.slice(0, 4);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="active-events-container">
      <div className="active-events-wrapper">
        {/* Header Section */}
        <div className="active-events-header">
          <div className="header-content">
            <div className="header-icon">
              <Calendar className="icon" />
            </div>
            <h1 className="header-title">Active Events</h1>
          </div>
          <p className="header-subtitle">Currently scheduled facial recognition events</p>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {displayedEvents.map((event, index) => (
            <div key={event.id} className="event-card">
              <div className="event-card-gradient"></div>
              
              <div className="event-card-content">
                <div className="event-card-header">
                  <span className="event-badge">
                    Event {index + 1}
                  </span>
                  <div className="status-indicator"></div>
                </div>

                <div className="event-details">
                  <div className="event-detail-row">
                    <Calendar className="detail-icon" />
                    <div className="detail-content">
                      <p className="detail-label">Date</p>
                      <p className="detail-value">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>

                  <div className="event-detail-row">
                    <Clock className="detail-icon" />
                    <div className="detail-content">
                      <p className="detail-label">Time</p>
                      <p className="detail-value">
                        {event.time}
                      </p>
                    </div>
                  </div>

                  <div className="event-timezone">
                    <p className="timezone-text">
                      <span className="timezone-label">Location:</span> {event.location}
                    </p>
                    <p className="timezone-text">
                      <span className="timezone-label">Timezone:</span> {event.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="events-summary">
          <div className="summary-content">
            <div className="summary-info">
              <p className="summary-label">Total Active Events</p>
              <p className="summary-count">{allEvents.length}</p>
            </div>
            <button 
              className="summary-button"
              onClick={() => setShowAllEvents(!showAllEvents)}
            >
              {showAllEvents ? 'Show Less' : 'View All Events'}
              <ChevronRight className="button-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Events Modal */}
      {showAllEvents && (
        <div className="modal-overlay" onClick={() => setShowAllEvents(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <Calendar className="modal-icon" />
                <h2 className="modal-title">All Active Events</h2>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowAllEvents(false)}
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="events-table">
                <div className="table-header">
                  <div className="table-cell">Event</div>
                  <div className="table-cell">Date</div>
                  <div className="table-cell">Time</div>
                  <div className="table-cell">Location</div>
                  <div className="table-cell">Status</div>
                </div>
                {allEvents.map((event, index) => (
                  <div key={event.id} className="table-row">
                    <div className="table-cell">
                      <span className="event-badge-small">Event {index + 1}</span>
                    </div>
                    <div className="table-cell">{formatDate(event.date)}</div>
                    <div className="table-cell">{event.time}</div>
                    <div className="table-cell">{event.location}</div>
                    <div className="table-cell">
                      <span className="status-badge">
                        <span className="status-dot"></span>
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveEventClean;