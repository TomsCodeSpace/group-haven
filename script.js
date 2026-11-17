
/* ============================================================
   COMMUNITY EVENTS MAP
   ============================================================

   PURPOSE:
   Controls the interactive event map prototype.

   MAIN FEATURES:
   - Select dates using the date slider.
   - Display events as map pins.
   - Open event information cards.
   - Join or leave an event.
   - Add new events through a modal form.
   - Drag the add-event button onto the map to select coordinates.
   - Display temporary notification messages (toasts).

   CURRENT LIMITATIONS:
   - Event data is stored in memory.
   - Refreshing the page resets newly created events.
   - Attendee information is stored locally in a Set.
   - Sharing, location services, and additional tabs are placeholders.

   ============================================================ */



/* ============================================================
   DYNAMIC DATE GENERATOR
   ============================================================ */

/**
 * Generates the next 7 calendar days, starting with today.
 *
 * Automatically determines:
 * - Date (YYYY-MM-DD)
 * - Day of the week (MON, TUE, etc.)
 * - Day of the month (1-31)
 *
 * Uses the user's local device date.
 *
 * @returns {Array} Array containing today's date and
 *                  the following six days.
 */

function generateNextSevenDays() {

    const days = [];

    // Get the current local date.
    const today = new Date();

    // Generate today + the next six days.
    for (let i = 0; i < 7; i++) {

        // Create a separate date object.
        const date = new Date(today);

        // Advance the date by i calendar days.
        date.setDate(today.getDate() + i);

        // Format date as YYYY-MM-DD.
        const year = date.getFullYear();

        const month = String(date.getMonth() + 1)
            .padStart(2, "0");

        const day = String(date.getDate())
            .padStart(2, "0");

        const dateKey = `${year}-${month}-${day}`;

        // Get abbreviated weekday.
        const dow = date.toLocaleDateString("en-US", {
            weekday: "short"
        }).toUpperCase();

        // Store the generated date.
        days.push({
            key: dateKey,
            dow: dow,
            day: String(date.getDate())
        });

    }

    return days;
}


// Generate the date selector.
const days = generateNextSevenDays();






/**
 * APPLICATION STATE
 *
 * selectedDate:
 * Currently selected date on the map.
 *
 * selectedEvent:
 * ID of the currently opened event.
 *
 * joined:
 * Set containing IDs of events the user has joined.
 *
 * Using a Set prevents duplicate event IDs.
 */



// Automatically select today when the application loads.
let selectedDate = days[0].key;
let selectedEvent = null;

const joined = new Set();


/**
 * EVENT DATABASE (PROTOTYPE)
 *
 * Each event contains:
 *
 * id          Unique event identifier.
 * title       Event name.
 * description Details about the event.
 * date        Event date (YYYY-MM-DD).
 * time        Displayed event time.
 * place       Physical event location.
 * price       Entry cost or pricing information.
 * contact     Event organizer or contact.
 * category    Event classification.
 * emoji       Icon displayed on the map pin.
 * x           Horizontal map position (percentage).
 * y           Vertical map position (percentage).
 *
 * IMPORTANT:
 * X and Y are percentages relative to the map container.
 */
const events = [

    {
        id: 1,
        title: "Downtown Food Truck Night",
        description: "Grab dinner from local food trucks, enjoy music, and meet your neighbors. Plenty of outdoor seating.",
        date: "2026-11-21",
        time: "5:00 PM – 8:00 PM",
        place: "Market Square",
        price: "Free entry",
        contact: "Downtown Association",
        category: "Food",
        emoji: "🍔",
        x: 32,
        y: 48
    },

    {
        id: 2,
        title: "Community Car Meet",
        description: "A relaxed afternoon for classic cars, builds, and anyone who loves engines. All vehicles welcome.",
        date: "2026-11-21",
        time: "2:00 PM – 4:30 PM",
        place: "Westside Parking Lot",
        price: "Free",
        contact: "Warrensburg Auto Club",
        category: "Community",
        emoji: "🚗",
        x: 69,
        y: 39
    },

    {
        id: 3,
        title: "Makers & Robotics Meetup",
        description: "See student-built robots, small electronics projects, and hands-on demonstrations. Beginners welcome.",
        date: "2026-11-22",
        time: "1:00 PM – 3:00 PM",
        place: "Innovation Hall",
        price: "Free",
        contact: "Makers Club",
        category: "Education",
        emoji: "🤖",
        x: 48,
        y: 63
    },

    {
        id: 4,
        title: "Acoustic Patio Session",
        description: "Local musicians play an easygoing outdoor set. Bring a friend and stay for a song or two.",
        date: "2026-11-20",
        time: "6:30 PM – 9:00 PM",
        place: "Juniper Coffee",
        price: "No cover",
        contact: "Juniper Coffee",
        category: "Music",
        emoji: "🎸",
        x: 23,
        y: 69
    },

    {
        id: 5,
        title: "Saturday Park Run",
        description: "A friendly community 5K. Walk, jog, or run at your own pace. Water available at the finish.",
        date: "2026-11-20",
        time: "9:00 AM – 10:30 AM",
        place: "Oak Park Entrance",
        price: "Free",
        contact: "Parks & Rec",
        category: "Sports",
        emoji: "🏃",
        x: 77,
        y: 73
    }

];


/* ============================================================
   2. HTML ELEMENT REFERENCES
   ============================================================

   Cache frequently used HTML elements so they can be
   accessed throughout the application without repeatedly
   searching the document.
   ============================================================ */

const pins = document.getElementById("pins");
const card = document.getElementById("eventCard");
const dateButtons = document.getElementById("dateButtons");
const toastEl = document.getElementById("toast");


/* ============================================================
   3. DATE SELECTOR
   ============================================================ */

/**
 * Renders the available dates as clickable buttons.
 *
 * Also populates the date dropdown in the event creation form.
 *
 * When a date is selected:
 * 1. Update selectedDate.
 * 2. Clear the currently selected event.
 * 3. Close the event information card.
 * 4. Re-render the date selector.
 * 5. Re-render map pins for the selected date.
 * 6. Update the date caption.
 */
function renderDates() {

    // Clear existing date buttons.
    dateButtons.innerHTML = "";

    days.forEach(d => {

        // Create a button for each available date.
        const b = document.createElement("button");

        // Highlight the currently selected date.
        b.className =
            "datebtn" +
            (d.key === selectedDate ? " active" : "");

        // Display the abbreviated weekday and day number.
        b.innerHTML = `<small>${d.dow}</small><b>${d.day}</b>`;

        // Handle date selection.
        b.addEventListener("click", () => {

            selectedDate = d.key;
            selectedEvent = null;

            // Close any previously opened event card.
            card.classList.remove("show");

            // Refresh the interface.
            renderDates();
            renderPins();



            // Update the date caption.
            document.getElementById("dateCaption").textContent =

                d.key === days[0].key
                    ? "Today"
                    : d.dow + ", " +
                    new Date(d.key + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                    });
            




        });

        dateButtons.appendChild(b);

    });


    // Populate the event creation date dropdown.
    const select = document.getElementById("newDate");

    select.innerHTML = days.map(d =>
        `<option value="${d.key}">${d.dow}, Nov ${d.day}</option>`
    ).join("");

}


/* ============================================================
   4. MAP PIN RENDERING
   ============================================================ */

/**
 * Displays map pins for the currently selected date.
 *
 * Process:
 * 1. Clear existing pins.
 * 2. Filter the event database by selectedDate.
 * 3. Create a button for each matching event.
 * 4. Position each button using its X/Y coordinates.
 * 5. Attach an event listener to open its information card.
 *
 * X and Y coordinates are percentages of the map dimensions.
 */
function renderPins() {

    // Remove pins from the previous date.
    pins.innerHTML = "";

    // Retrieve events matching the selected date.
    const todays = events.filter(e => e.date === selectedDate);

    todays.forEach(e => {

        // Create the clickable map pin.
        const b = document.createElement("button");

        // Highlight the currently selected event.
        b.className =
            "pin" +
            (selectedEvent === e.id ? " selected" : "");

        // Set pin position relative to the map.
        b.style.left = e.x + "%";
        b.style.top = e.y + "%";

        // Accessibility label.
        b.setAttribute("aria-label", e.title);

        // Pin icon and event title.
        b.innerHTML = `
            <div class="bubble">
                <span>${e.emoji}</span>
            </div>
            <span class="pinlabel">${e.title}</span>
        `;

        // Open the corresponding event when clicked.
        b.addEventListener("click", () => openEvent(e.id));

        // Add the pin to the map.
        pins.appendChild(b);

    });

}


/* ============================================================
   5. EVENT INFORMATION CARD
   ============================================================ */

/**
 * Opens the information card for a specific event.
 *
 * @param {number} id - Unique ID of the selected event.
 *
 * Retrieves the event from the database and populates
 * the corresponding HTML elements with its information.
 */
function openEvent(id) {

    selectedEvent = id;

    // Find the event associated with this ID.
    const e = events.find(x => x.id === id);

    // Stop if the event does not exist.
    if (!e) return;

    // Populate the event information card.
    document.getElementById("eventCategory").textContent =
        "✦ " + e.category;

    document.getElementById("eventTitle").textContent =
        e.title;

    document.getElementById("eventDescription").textContent =
        e.description;

    document.getElementById("eventTime").textContent =
        e.time;

    document.getElementById("eventPlace").textContent =
        e.place;

    document.getElementById("eventPrice").textContent =
        e.price;

    document.getElementById("eventContact").textContent =
        e.contact;


    // Update the join button based on attendance status.
    const joinBtn = document.getElementById("joinBtn");

    joinBtn.textContent =
        joined.has(id) ? "You're added ✓" : "Add Me";

    joinBtn.classList.toggle("joined", joined.has(id));


    // Display the card and highlight the selected map pin.
    card.classList.add("show");

    renderPins();

}


/* ============================================================
   6. NOTIFICATION SYSTEM (TOASTS)
   ============================================================ */

/**
 * Displays a temporary notification message.
 *
 * @param {string} msg - Message to display.
 *
 * Automatically hides the notification after 2.2 seconds.
 */
function toast(msg) {

    toastEl.textContent = msg;

    toastEl.classList.add("show");

    setTimeout(() => {
        toastEl.classList.remove("show");
    }, 2200);

}


/* ============================================================
   7. EVENT CARD BUTTONS
   ============================================================ */


/**
 * CLOSE EVENT CARD
 *
 * Clears the selected event and hides the information card.
 */
document.getElementById("closeCard").onclick = () => {

    selectedEvent = null;

    card.classList.remove("show");

    renderPins();

};


/**
 * JOIN / LEAVE EVENT
 *
 * Uses the joined Set to track attendance.
 *
 * If the user has already joined:
 * - Remove the event ID from the Set.
 *
 * Otherwise:
 * - Add the event ID to the Set.
 *
 * NOTE:
 * This is currently prototype-only attendance tracking.
 */
document.getElementById("joinBtn").onclick = () => {

    // Ensure an event is currently selected.
    if (selectedEvent === null) return;

    if (joined.has(selectedEvent)) {

        joined.delete(selectedEvent);

        toast("You're no longer on the attendee list.");

    } else {

        joined.add(selectedEvent);

        toast("You're on the list! (Prototype only)");

    }

    // Refresh the event card to reflect the new status.
    openEvent(selectedEvent);

};


/**
 * SHARE EVENT
 *
 * Placeholder for future event-sharing functionality.
 */
document.getElementById("shareBtn").onclick = () => {

    toast("Event sharing would be connected here.");

};


/* ============================================================
   8. EVENT CREATION MODAL
   ============================================================ */


/**
 * OPEN EVENT CREATION MODAL
 *
 * Opens the modal when the user clicks the add-event button.
 */
document.getElementById("addEventBtn").onclick = () => {

    document.getElementById("modalBack").classList.add("open");

};


/**
 * CLOSE EVENT CREATION MODAL
 *
 * Closes the modal using the close button.
 */
document.getElementById("closeModal").onclick = () => {

    document.getElementById("modalBack").classList.remove("open");

};


/**
 * CLOSE MODAL WHEN CLICKING OUTSIDE IT
 *
 * Checks whether the user clicked the modal background
 * rather than the modal's contents.
 */
document.getElementById("modalBack").addEventListener("click", e => {

    if (e.target.id === "modalBack") {

        e.currentTarget.classList.remove("open");

    }

});


/* ============================================================
   9. EVENT CREATION FORM
   ============================================================ */

/**
 * Creates a new event using information entered into the form.
 *
 * Process:
 * 1. Prevent the browser's default form submission.
 * 2. Generate a unique event ID.
 * 3. Retrieve form values.
 * 4. Add the new event to the events array.
 * 5. Switch the map to the new event's date.
 * 6. Refresh the interface.
 * 7. Close and reset the form.
 * 8. Display a confirmation message.
 *
 * X/Y coordinates are retrieved from the form.
 * These coordinates are populated by the drag-and-drop feature.
 */
document.getElementById("eventForm").onsubmit = e => {

    e.preventDefault();


    // Generate the next event ID.
    const id = Math.max(...events.map(x => x.id)) + 1;

    // Retrieve the selected event date.
    const d = document.getElementById("newDate").value;


    // Create and store the new event.
    events.push({

        id,

        title: document.getElementById("newTitle").value,

        // Coordinates supplied by the map drag-and-drop feature.
        x: Number(document.getElementById("eventX").value),
        y: Number(document.getElementById("eventY").value),

        description:
            document.getElementById("newDescription").value ||
            "A newly added community event.",

        date: d,

        time: document.getElementById("newTime").value,

        place: "Downtown",

        price: "Details at event",

        contact:
            document.getElementById("newContact").value ||
            "Event organizer",

        category: document.getElementById("newCategory").value,

        emoji: "📍"

    });


    // Switch the map to the newly created event's date.
    selectedDate = d;

    selectedEvent = null;


    // Refresh the interface.
    renderDates();
    renderPins();

    card.classList.remove("show");


    // Close the modal.
    document.getElementById("modalBack").classList.remove("open");


    // Clear the form for the next event.
    e.target.reset();


    // Confirm successful creation.
    toast("Event added to this prototype session.");

};


/* ============================================================
   10. BOTTOM NAVIGATION
   ============================================================ */

/**
 * Handles navigation bar selection.
 *
 * Currently, only the Map screen is implemented.
 * Other tabs display a placeholder notification.
 */
document.querySelectorAll(".navitem").forEach(b => {

    b.onclick = () => {

        // Remove active styling from every navigation item.
        document.querySelectorAll(".navitem").forEach(x => {
            x.classList.remove("active");
        });

        // Highlight the selected navigation item.
        b.classList.add("active");


        // Display a placeholder message for unfinished screens.
        if (b.dataset.tab !== "Map") {

            toast(b.dataset.tab + " view is a future prototype screen.");

        }

    };

});


/* ============================================================
   11. LOCATION BUTTONS
   ============================================================ */

/**
 * USER LOCATION
 *
 * Placeholder for future browser geolocation integration.
 */
document.getElementById("locateBtn").onclick = () => {

    toast("Location services can be connected in a later version.");

};


/**
 * CITY / NEIGHBORHOOD SELECTION
 *
 * Placeholder for future location filtering functionality.
 */
document.getElementById("locationBtn").onclick = () => {

    toast("City and neighborhood selection can be added here.");

};


/* ============================================================
   12. DRAG-AND-DROP EVENT PIN
   ============================================================ */

/**
 * Enables drag-and-drop functionality for the add-event button.
 *
 * USER WORKFLOW:
 *
 * 1. Press and hold the add-event button.
 * 2. A visual clone of the button follows the pointer.
 * 3. Drag the clone over the map.
 * 4. Release the pointer.
 * 5. If released inside the map:
 *      - Calculate X/Y coordinates.
 *      - Populate the event form's hidden coordinate inputs.
 *      - Display the selected coordinates.
 *      - Open the event creation modal.
 *
 * TECHNICAL DETAILS:
 *
 * Pointer Events are used instead of separate mouse and touch
 * event listeners.
 *
 * getBoundingClientRect() determines the map's screen position.
 *
 * Coordinates are converted into percentages so pins remain
 * positioned proportionally if the map changes dimensions.
 */
function enableDraggableEventPin() {


    /* --------------------------------------------------------
       A. HTML ELEMENT REFERENCES
       -------------------------------------------------------- */

    const addPin = document.getElementById("addEventBtn");

    const map = document.querySelector(".map");

    const modal = document.getElementById("modalBack");

    const coordinatesDisplay =
        document.getElementById("pinCoordinates");

    const eventXInput =
        document.getElementById("eventX");

    const eventYInput =
        document.getElementById("eventY");


    /* --------------------------------------------------------
       B. DRAG STATE
       -------------------------------------------------------- */

    // Visual copy of the add-event button.
    let dragClone = null;

    // Tracks whether a drag operation is currently active.
    let dragging = false;


    /* --------------------------------------------------------
       C. POINTER DOWN — START DRAGGING
       -------------------------------------------------------- */

    addPin.addEventListener("pointerdown", e => {

        // Prevent the browser's default pointer behavior.
        e.preventDefault();

        dragging = true;


        // Create a visual copy of the original add-event button.
        dragClone = addPin.cloneNode(true);

        // Remove the original button's ID from the clone.
        dragClone.removeAttribute("id");


        // Position the clone independently of the document layout.
        dragClone.style.position = "fixed";

        dragClone.style.left = `${e.clientX}px`;
        dragClone.style.top = `${e.clientY}px`;

        // Center the clone directly under the pointer.
        dragClone.style.transform = "translate(-50%, -50%)";

        // Prevent the clone from intercepting pointer interactions.
        dragClone.style.pointerEvents = "none";

        // Keep the clone above other interface elements.
        dragClone.style.zIndex = "9999";

        // Prevent inherited margins from shifting the clone.
        dragClone.style.margin = "0";


        // Add the visual clone to the document.
        document.body.appendChild(dragClone);


        // Keep receiving pointer events during the drag.
        addPin.setPointerCapture(e.pointerId);

    });


    /* --------------------------------------------------------
       D. POINTER MOVE — UPDATE DRAG POSITION
       -------------------------------------------------------- */

    addPin.addEventListener("pointermove", e => {

        // Ignore movement if no drag operation is active.
        if (!dragging || !dragClone) return;


        // Keep the visual clone aligned with the pointer.
        dragClone.style.left = `${e.clientX}px`;
        dragClone.style.top = `${e.clientY}px`;

    });


    /* --------------------------------------------------------
       E. POINTER UP — COMPLETE DRAGGING
       -------------------------------------------------------- */

    addPin.addEventListener("pointerup", e => {

        if (!dragging) return;

        dragging = false;


        // Get the map's position and dimensions on the screen.
        const mapRect = map.getBoundingClientRect();


        // Determine whether the pointer was released inside the map.
        const insideMap =

            e.clientX >= mapRect.left &&
            e.clientX <= mapRect.right &&

            e.clientY >= mapRect.top &&
            e.clientY <= mapRect.bottom;


        if (insideMap) {


            /* ------------------------------------------------
               F. CONVERT SCREEN POSITION TO MAP COORDINATES
               ------------------------------------------------

               X = Horizontal position as a percentage of map width.
               Y = Vertical position as a percentage of map height.

               Subtracting mapRect.left/top converts screen
               coordinates into coordinates relative to the map.
               ------------------------------------------------ */

            const x =
                ((e.clientX - mapRect.left) / mapRect.width) * 100;

            const y =
                ((e.clientY - mapRect.top) / mapRect.height) * 100;


            /* ------------------------------------------------
               G. UPDATE EVENT FORM
               ------------------------------------------------ */

            // Store coordinates in the form inputs.
            eventXInput.value = x.toFixed(2);
            eventYInput.value = y.toFixed(2);


            // Display coordinates to the user.
            coordinatesDisplay.textContent =
                `X: ${x.toFixed(1)}%, Y: ${y.toFixed(1)}%`;


            // Store coordinates in a global variable for reference.
            window.newEventCoordinates = { x, y };


            // Open the event creation modal.
            modal.classList.add("open");

        }


        /* ----------------------------------------------------
           H. CLEANUP
           ---------------------------------------------------- */

        // Remove the visual clone after the drag ends.
        if (dragClone) {

            dragClone.remove();

            dragClone = null;

        }

    });


    /* --------------------------------------------------------
       I. POINTER CANCEL — ABORT DRAGGING
       -------------------------------------------------------- */

    addPin.addEventListener("pointercancel", () => {

        dragging = false;


        // Remove the visual clone if the drag is interrupted.
        if (dragClone) {

            dragClone.remove();

            dragClone = null;

        }

    });

}


/* ============================================================
   13. APPLICATION INITIALIZATION
   ============================================================ */

/**
 * Initializes the draggable event pin functionality.
 */
enableDraggableEventPin();


/**
 * Initial interface rendering.
 *
 * Runs once when this JavaScript file executes.
 *
 * 1. Render the available dates.
 * 2. Display pins matching the initially selected date.
 */
renderDates();
renderPins();
