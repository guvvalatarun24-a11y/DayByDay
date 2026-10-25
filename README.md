# DayByDay — Personal Learning Tracker

**Small Steps. Every Day.**

DayByDay is a personal learning and productivity web application designed to help users build consistent learning habits, manage skills, track study time, and monitor their personal growth. It provides a centralized dashboard to organize learning activities, manage tasks, and visualize progress over time.

## Features

* **Dashboard:** View study statistics, learning streaks, progress summaries, and upcoming tasks in one place.
* **My Skills:** Add, edit, and manage skills, set learning goals, track progress, and record notes.
* **Study Timer:** Track study sessions with start, pause, resume, and finish controls.
* **Manual Time Entry:** Record study time manually when needed.
* **Analytics:** Monitor total study time, active learning days, streaks, and skill-wise progress through charts and visual summaries.
* **To-Do List:** Create and manage tasks with deadlines, priorities, and completion status.
* **Upcoming Tasks:** View upcoming and overdue tasks organized by time period.
* **Themes:** Switch between Light Pastel and Dark Slate themes.
* **Data Persistence:** Save application data locally in the browser.
* **Import and Export:** Back up and restore supported application data using JSON files.

## Technology Stack

The exact technologies depend on the generated project configuration.

* **Frontend:** HTML, CSS, and JavaScript or TypeScript
* **UI Framework:** React, if included in the project
* **Development and Build Tool:** Vite, if included in the project
* **Local Storage:** Browser `localStorage`
* **Development Environment:** Google AI Studio Build and Visual Studio Code
* **Version Control:** Git and GitHub

## Getting Started

### Prerequisites

Install the following tools:

* [Node.js](https://nodejs.org/)
* [Git](https://git-scm.com/)
* [Visual Studio Code](https://code.visualstudio.com/)

### Installation

**1. Download or clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/daybyday.git
```

Replace `YOUR-USERNAME` with your GitHub username.

**2. Open the project folder**

```bash
cd daybyday
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in your terminal to use the application.

> Note: These commands assume the project uses npm and provides a `dev` script. Check `package.json` if your project uses a different setup.

## Data Storage

DayByDay currently uses browser local storage to save learning data, including skills, study sessions, tasks, and settings.

* Data generally remains available in the same browser on the same device.
* Clearing browser storage may delete locally saved application data.
* Local storage does not automatically synchronize data across devices or browsers.
* Use the application's JSON export feature to back up supported data regularly.

## Project Structure

The exact structure depends on the generated application. A typical project may look like this:

```text
daybyday/
├── public/          # Static assets
├── src/             # Application source code
├── package.json     # Project dependencies and scripts
├── index.html       # Main HTML entry point
├── vite.config.ts   # Vite configuration, if used
└── README.md        # Project documentation
```

## Future Improvements

Potential enhancements include:

* Cloud-based data storage and synchronization
* User authentication and individual accounts
* Cross-device learning progress tracking
* Notifications and reminders for learning goals
* More detailed analytics and reports
* Calendar-based study planning
* Additional customization options

These are possible future enhancements, not necessarily features currently implemented.

## Contributing

Suggestions, bug reports, and feature ideas are welcome. If you want to contribute, fork the repository, create a branch for your changes, and submit a pull request.

## License

No license has been specified yet. Add an appropriate license before allowing others to reuse or distribute this project.

---

**DayByDay — Build better habits, one day at a time.**
